"""Optional real PHP integration tests; synthetic accounts in the isolated verification DB only."""
import json,os,socket,subprocess,time,urllib.request,urllib.error,concurrent.futures
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];AUDIT=ROOT/'.server-audit';PHP='C:/xampp/php/php.exe';BACKEND=Path('C:/xampp/htdocs/E2E_Tracking')
db=json.loads((AUDIT/'teamflow-test-db.json').read_text())['database'];assert db.startswith('e2e_teamflow_verify_')
env={**os.environ,'DB_NAME':db,'TEAMFLOW_FILE_DIR':str(AUDIT/'teamflow-test-files'),'EMPLOYEE_DOCUMENT_DIR':str(AUDIT/'teamflow-test-profile-documents')}
users=json.loads(subprocess.run([PHP,str(AUDIT/'create-weekly-fixtures.php')],env=env,capture_output=True,text=True,check=True).stdout)
with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
log=(AUDIT/'weekly-api.log').open('wb');server=subprocess.Popen([PHP,'-d','display_errors=0','-d','display_startup_errors=0','-S',f'127.0.0.1:{port}','-t',str(BACKEND),str(AUDIT/'teamflow-test-router.php')],env=env,stdout=log,stderr=log,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
def req(method,path,who='a',data=None,status=200):
 headers={'Authorization':'Bearer '+users[who]['token'],'Content-Type':'application/json'};request=urllib.request.Request(f'http://127.0.0.1:{port}'+path,data=None if data is None else json.dumps(data).encode(),headers=headers,method=method)
 try:
  with urllib.request.urlopen(request,timeout=30) as response:code=response.status;raw=response.read()
 except urllib.error.HTTPError as error:code=error.code;raw=error.read()
 body=json.loads(raw);assert code==status,(path,code,body.get('message'));return body
try:
 for _ in range(100):
  try:urllib.request.urlopen(f'http://127.0.0.1:{port}/health',timeout=1);break
  except urllib.error.HTTPError:break
  except OSError:time.sleep(.1)
 week={'year':2026,'week_no':46};query='/teamflow/timesheets/weekly?year=2026&week_no=46'
 assert req('GET',query)['data']['entries']==[]
 req('GET',query+'&candidate_id='+str(users['b']['candidate_id']),status=403)
 project=req('POST','/teamflow/projects','admin',{'name':'Weekly fixture project','projectKey':'WEEK','lead_user_id':users['a']['id']},201)['data']['id']
 task=req('POST','/teamflow/issues','admin',{'project':project,'summary':'Weekly fixture task','assignee_user_id':users['a']['id'],'status':'Open'},201)['data']['id']
 assert req('GET',f'/teamflow/projects/{project}/tasks')['data'][0]['id']
 entry={'entry_type':'project','project_id':project,'task_issue_id':task,'task_name':'Fixture task','worked_on':'Weekly testing','mon_hours':0}
 req('POST','/teamflow/timesheets/weekly/save',data={**week,'entries':[entry]})
 row=req('GET',query)['data']['entries'][0];old=dict(row)
 req('GET',f"/teamflow/timesheets/{row['id']}",'b',status=404)
 req('POST','/teamflow/timesheets/weekly/save',data={**week,'entries':[{**row,'mon_hours':8.25,'tue_hours':7.75}]})
 req('POST','/teamflow/timesheets/weekly/save',data={**week,'entries':[{**old,'mon_hours':1}]},status=422)
 row=req('GET',query)['data']['entries'][0];assert float(row['total_hours'])==16
 req('POST','/teamflow/timesheets/weekly/save',data={**week,'entries':[{**row,'mon_hours':25}]},status=422)
 req('POST','/teamflow/timesheets/weekly/save',data={**week,'entries':[],'submit':True})
 pending=req('GET',query)['data']['entries'][0];assert pending['status']=='Pending'
 admin_notices=req('GET','/chat/notifications','admin')['data'];dev_notices=req('GET','/chat/notifications','developer')['data']
 assert any(n['type']=='timesheet_submitted' for n in admin_notices) and any(n['type']=='timesheet_submitted' for n in dev_notices)
 assert req('GET',query,'admin')['data']['scope']=='ALL'
 review={**week,'candidate_id':users['a']['candidate_id'],'entry_ids':[pending['id']],'status':'Approved'}
 req('POST','/teamflow/timesheets/weekly/review','developer',review,status=403)
 req('POST','/teamflow/timesheets/weekly/review','admin',review)
 req('POST','/teamflow/timesheets/weekly/review','admin',review,status=422)
 req('POST','/teamflow/timesheets/weekly/save',data={**week,'entries':[{**pending,'mon_hours':1}]},status=403)
 assert any(n['type']=='timesheet_approved' for n in req('GET','/chat/notifications')['data'])
 copied=req('POST','/teamflow/timesheets/weekly/copy',data={'year':2026,'week_no':47})
 copied_rows=req('GET','/teamflow/timesheets/weekly?year=2026&week_no=47')['data']['entries'];assert copied_rows and sum(float(r['total_hours']) for r in copied_rows)==0
 # A project discussion includes the actual project team, not client-supplied outsiders.
 context={'type':'contextual','context':{'type':'teamflow_project','id':str(project),'title':'Spoofed title','url':'/wrong'},'member_ids':[users['outsider']['id']]}
 conversation=req('POST','/chat/conversations',data=context,status=201)['data']['id']
 members=req('GET',f'/chat/conversations/{conversation}/members')['data'];assert users['outsider']['id'] not in [int(m['user_id']) for m in members]
 req('POST','/chat/conversations','outsider',context,status=403)
 req('GET',f'/chat/conversations/{conversation}/messages','outsider',status=403)
 req('POST',f'/chat/conversations/{conversation}/members',data={'member_ids':[users['outsider']['id']]},status=403)
 req('POST',f'/teamflow/projects/{project}/assign','admin',{'user_ids':[users['b']['id']]})
 assert any(n['type']=='project_assigned' for n in req('GET','/chat/notifications','b')['data'])
 req('POST','/chat/conversations','b',context,201)
 message=req('POST',f'/chat/conversations/{conversation}/messages',data={'body':'Synthetic project discussion','client_id':'weekly-'+str(users['a']['id'])},status=201)['data']['id']
 assert any(n['type']=='message' and int(n['message_id'])==message for n in req('GET','/chat/notifications','b')['data'])
 assert req('GET',f'/chat/conversations/{conversation}/messages','b')['data']
 task_context={'type':'contextual','context':{'type':'teamflow_task','id':str(task),'title':'Task'},'member_ids':[]}
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  futures=[pool.submit(req,'POST','/chat/conversations',who,task_context,201) for who in ['a','b']]
  created=[f.result()['data']['id'] for f in futures];assert created[0]==created[1]
 task_conv=created[0];req('POST','/chat/conversations','outsider',task_context,status=403)
 req('POST','/chat/conversations',data={'type':'group','name':'Weekly fixture group','member_ids':[users['b']['id']]},status=201)
 # Clocked work is editable in draft with an audit reason and immutable recorded worklogs.
 req('POST','/teamflow/attendance/clock',data={'action':'in','project_id':project,'module_name':'Weekly automatic','working_on':'Test editable work hours'})
 subprocess.run([PHP,str(AUDIT/'teamflow-clock-fixture.php'),'elapsed',str(users['a']['id'])],env=env,capture_output=True,text=True,check=True)
 req('POST','/teamflow/attendance/clock',data={'action':'out','worked_on':'Completed automatic work','progress_percent':90})
 autos=[r for r in req('GET','/teamflow/timesheets')['data'] if r['source_type']=='attendance'];assert autos
 auto=autos[0];key=next(d+'_hours' for d in ['mon','tue','wed','thu','fri','sat','sun'] if float(auto[d+'_hours'])>0)
 req('POST',f"/teamflow/timesheets/{auto['id']}",data={**auto,key:.75},status=422)
 req('POST',f"/teamflow/timesheets/{auto['id']}",data={**auto,key:.75,'adjustment_reason':'Non-billable break excluded'})
 detail=req('GET',f"/teamflow/timesheets/{auto['id']}")['data'];assert detail['changes'] and float(detail[key])==.75
 assert sum(int(w['duration_seconds']) for w in detail['worklogs'])>=5400
 req('POST','/teamflow/attendance/clock',data={'action':'in','project_id':project,'module_name':'Additional','working_on':'Do not overwrite corrections'})
 subprocess.run([PHP,str(AUDIT/'teamflow-clock-fixture.php'),'elapsed',str(users['a']['id'])],env=env,capture_output=True,text=True,check=True)
 req('POST','/teamflow/attendance/clock',data={'action':'out','worked_on':'Additional completed','progress_percent':100})
 assert abs(float(req('GET',f"/teamflow/timesheets/{auto['id']}")['data'][key])-2.25)<.03
 summary={'success':True,'weekly_scope_and_filters':True,'editable_hours_and_validation':True,'stale_revision_rejected':True,'submission_admin_developer_notifications':True,'review_and_candidate_notification':True,'copy_previous_zero_hours':True,'project_assignment_notification':True,'project_and_task_chat_scoped':True,'outsider_chat_access_denied':True,'group_chat_for_candidates':True,'message_notifications':True,'automatic_hour_adjustment_audit':True,'recorded_worklogs_preserved':True,'new_work_preserves_hour_overrides':True}
 (AUDIT/'teamflow-weekly-api-results.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary))
finally:
 server.terminate()
 try:server.wait(timeout=5)
 except subprocess.TimeoutExpired:server.kill()
 log.close()
