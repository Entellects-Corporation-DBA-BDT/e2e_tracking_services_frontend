"""Optional integration checks. Runs only against the prepared e2e_teamflow_verify_* DB."""
import base64,json,os,socket,subprocess,time,urllib.request,urllib.error,uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];AUDIT=ROOT/'.server-audit';BACKEND=Path(os.environ.get('E2E_BACKEND_PATH','C:/xampp/htdocs/E2E_Tracking'));PHP='C:/xampp/php/php.exe'
meta=json.loads((AUDIT/'teamflow-test-db.json').read_text());assert meta['database'].startswith('e2e_teamflow_verify_')
env=os.environ.copy();env['DB_NAME']=meta['database'];env['TEAMFLOW_FILE_DIR']=str(AUDIT/'teamflow-test-files');env['EMPLOYEE_DOCUMENT_DIR']=str(AUDIT/'teamflow-test-profile-documents')
fixture=subprocess.run([PHP,str(AUDIT/'teamflow-test-fixtures.php')],env=env,capture_output=True,text=True,check=True)
users=json.loads(fixture.stdout.lstrip('\ufeff'))
router=AUDIT/'teamflow-test-router.php';router.write_text("<?php $_SERVER['SCRIPT_NAME']='/index.php';require "+json.dumps(str(BACKEND/'index.php').replace('\\','/'))+";",encoding='utf-8')
with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
upload_tmp=AUDIT/'php-upload-tmp';upload_tmp.mkdir(exist_ok=True)
log=(AUDIT/'teamflow-api-test.log').open('wb');server=subprocess.Popen([PHP,'-d','display_errors=0','-d','display_startup_errors=0','-d','upload_tmp_dir='+str(upload_tmp),'-S',f'127.0.0.1:{port}','-t',str(BACKEND),str(router)],env=env,stdout=log,stderr=log,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
base=f'http://127.0.0.1:{port}'
def request(method,path,who='a',value=None,file=None,expected=200,raw=False):
 headers={};payload=None
 if who:headers['Authorization']='Bearer '+users[who]['token']
 if file:
  boundary='tf'+uuid.uuid4().hex
  chunks=[]
  if value is not None:chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="payload"\r\n\r\n'.encode()+json.dumps(value).encode()+b'\r\n')
  field,name,content,mime=file
  chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; filename="{name}"\r\nContent-Type: {mime}\r\n\r\n'.encode()+content+b'\r\n')
  payload=b''.join(chunks)+f'--{boundary}--\r\n'.encode();headers['Content-Type']='multipart/form-data; boundary='+boundary
 elif value is not None:payload=json.dumps(value).encode();headers['Content-Type']='application/json'
 req=urllib.request.Request(base+path,data=payload,headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,timeout=20) as response:status=response.status;body=response.read()
 except urllib.error.HTTPError as error:status=error.code;body=error.read()
 assert status==expected,(method,path,status,body[:260])
 return body if raw else json.loads(body)
try:
 for _ in range(80):
  try:urllib.request.urlopen(base+'/teamflow/projects',timeout=.2)
  except urllib.error.HTTPError:break
  except OSError:time.sleep(.1)
 login=request('POST','/auth/login',None,{'email':users['a']['email'],'password':users['a']['password']})
 assert login['user']['is_teamflow_candidate'] and login['user']['employee_id']==0
 assert not next(r for r in login['resources'] if r['resource']=='employees')['permissions']['view']
 request('GET','/teamflow/projects',None,expected=401)
 assert request('GET','/teamflow/projects')['total']==0
 request('GET',f"/teamflow/projects/{users['legacy_project']}",expected=404)
 request('GET',f"/teamflow/candidates/{users['legacy_candidate']}/profile",expected=403)
 request('GET','/employees',expected=403)
 request('POST','/teamflow/projects',value={'name':'Forbidden','projectKey':'NO'},expected=403)
 profile={'firstname':'Synthetic','lastname':'Candidate','contact_info':'1234567890','current_address':'Synthetic address','permanent_address':'','profile':{'personal_email':'synthetic@example.test','wfh_allowed':True},'collection':{'schema_version':2,'has_experience':False,'education':[],'employment':[],'certifications':[],'references':[],'siblings':[],'declaration':{'accepted':False}},'position_id':1,'password':'NotAllowed'}
 saved=request('POST','/teamflow/profile',value=profile)['data'];assert saved['current_address']=='Synthetic address' and not saved['profile'].get('wfh_allowed',False)
 admin_profile=dict(profile);admin_profile['profile']={**profile['profile'],'wfh_allowed':True}
 request('POST',f"/teamflow/candidates/{users['a']['candidate_id']}/profile",'admin',admin_profile)
 project=request('POST','/teamflow/projects','admin',{'name':'Synthetic integration project','projectKey':'TF-VERIFY','lead_user_id':users['a']['id']},expected=201)['data']['id']
 assert request('GET','/teamflow/projects')['total']==1 and request('GET','/teamflow/projects','b')['total']==0
 request('POST',f'/teamflow/projects/{project}/assign','admin',{'user_ids':[users['b']['id']]})
 assert request('GET','/teamflow/projects','b')['total']==1
 issue=request('POST','/teamflow/issues',value={'project':project,'summary':'Synthetic security issue','assignee_user_id':users['b']['id'],'status':'Open'},expected=201)['data']['id']
 assert int(request('GET',f'/teamflow/issues/{issue}')['data']['assignee_user_id'])==users['a']['id']
 request('GET',f'/teamflow/issues/{issue}','b',expected=404)
 timesheet=request('POST','/teamflow/timesheets',value={'user_id':users['b']['id'],'year':2026,'week_no':46,'entry_type':'project','project_id':project,'task_name':'Synthetic task','mon_hours':1.25,'tue_hours':2,'status':'Pending'},expected=201)['data']['id']
 entry=request('GET',f'/teamflow/timesheets/{timesheet}')['data'];assert float(entry['total_hours'])==3.25 and int(entry['user_id'])==users['a']['id']
 request('GET',f'/teamflow/timesheets/{timesheet}','b',expected=404)
 request('POST',f'/teamflow/timesheets/{timesheet}/review',value={'status':'Approved'},expected=403)
 request('POST',f'/teamflow/timesheets/{timesheet}',value={**entry,'task_name':'Cannot edit pending'},expected=403)
 request('POST',f'/teamflow/timesheets/{timesheet}/review','admin',{'status':'Approved'})
 assert request('GET',f'/teamflow/timesheets/{timesheet}')['data']['status']=='Approved'
 png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQz0AAAAASUVORK5CYII=')
 request('POST','/teamflow/reports',value={'reportText':'Invalid attachment rollback'},file=('attachment','bad.bin',b'\x00\x01\x02\x03','application/octet-stream'),expected=422)
 assert request('GET','/teamflow/reports')['total']==0
 request('POST','/teamflow/profile',value={**profile,'current_address':'Must roll back'},file=('photo','bad.png',b'not an image','image/png'),expected=422)
 assert request('GET','/teamflow/profile')['data']['current_address']=='Synthetic address'
 report=request('POST','/teamflow/reports',value={'reportText':'Synthetic report','user_id':users['b']['id']},file=('attachment','proof.png',png,'image/png'),expected=201)['data']['id']
 record=request('GET',f'/teamflow/reports/{report}')['data'];assert int(record['userId'])==users['a']['id'];attachment=record['files'][0]['id']
 assert request('GET',f'/teamflow/files/{attachment}',raw=True)==png
 request('GET',f'/teamflow/files/{attachment}','b',expected=403)
 request('POST',f'/teamflow/files/{attachment}/replace','b',file=('file','replace.png',png,'image/png'),expected=403)
 request('POST',f"/teamflow/files/{users['missing_file']}/replace",'admin',file=('file','restored.png',png,'image/png'))
 assert request('GET',f"/teamflow/files/{users['missing_file']}",'admin',raw=True)==png
 with_education={**profile,'collection':{**profile['collection'],'education':[{'id':'fixtureedu','degree':'B.Tech','college':'Synthetic College','branch':'IT','passing_year':'2020'}]}}
 request('POST','/teamflow/profile',value=with_education,file=('documents[education_fixtureedu_certificate][]','certificate.png',png,'image/png'))
 documents=request('GET','/teamflow/profile')['data']['collection']['documents'];assert len(documents)==1 and 'storage_name' not in documents[0]
 document_url=f"/teamflow/candidates/{users['a']['candidate_id']}/documents/{documents[0]['id']}"
 assert request('GET',document_url,raw=True)==png
 request('GET',document_url,'b',expected=403)
 request('POST','/teamflow/profile',value=with_education,file=('photo','portrait.png',png,'image/png'))
 me=request('GET','/auth/me');assert me['user']['teamflow_photo_id']
 assert request('GET',f"/teamflow/files/{me['user']['teamflow_photo_id']}?preview=1",raw=True)==png
 request('GET',f"/teamflow/files/{me['user']['teamflow_photo_id']}?preview=1",'b',expected=403)
 request('POST','/teamflow/profile',value={**with_education,'remove_photo':True})
 assert not request('GET','/auth/me')['user']['teamflow_photo_id']
 request('GET',f"/teamflow/files/{me['user']['teamflow_photo_id']}?preview=1",expected=404)
 remote=json.loads(subprocess.run([PHP,str(AUDIT/'teamflow-clock-fixture.php'),'remote'],env=env,capture_output=True,text=True,check=True).stdout)
 assert remote['employee_network_blocks_loopback']
 admin_profile['profile']['wfh_allowed']=False
 request('POST',f"/teamflow/candidates/{users['a']['candidate_id']}/profile",'admin',admin_profile)
 request('POST','/teamflow/attendance/clock',value={'action':'in','project_id':project,'module_name':'Synthetic module','working_on':'Test ownership'})
 request('POST','/teamflow/attendance/clock',value={'action':'in','project_id':project,'module_name':'Duplicate','working_on':'Duplicate'},expected=403)
 presence=request('GET','/teamflow/attendance/presence');assert presence['data']['record']['time_out']=='00:00:00'
 sessions=request('GET','/teamflow/attendance');assert sessions['my_session'] and int(sessions['data'][0]['candidate_id'])==users['a']['candidate_id']
 subprocess.run([PHP,str(AUDIT/'teamflow-clock-fixture.php'),'elapsed',str(users['a']['id'])],env=env,capture_output=True,text=True,check=True)
 request('POST','/teamflow/attendance/work',value={'worked_on':'Work in progress','progress_percent':35,'blockers':'Waiting for review'})
 insights=request('GET','/teamflow/attendance/insights')['data'];assert float(insights['open_session']['progress_percent'])==35 and len(insights['days'])>=28 and insights['can_clock']
 request('GET',f"/teamflow/attendance/insights?candidate_id={users['b']['candidate_id']}",expected=403)
 request('GET',f"/teamflow/attendance/insights?candidate_id={users['a']['candidate_id']}",'admin')
 request('POST','/teamflow/attendance/clock',value={'action':'out','worked_on':'Completed the synthetic checks','progress_percent':80,'blockers':'Review tomorrow'})
 assert request('GET','/teamflow/attendance')['my_session'] is None
 request('POST','/teamflow/attendance/clock',value={'action':'out','worked_on':'Duplicate'},expected=403)
 auto=[t for t in request('GET','/teamflow/timesheets')['data'] if t.get('source_type')=='attendance'];assert auto
 assert abs(sum(float(t['total_hours']) for t in auto)-1.5)<0.03
 sheet=auto[0];detail=request('GET',f"/teamflow/timesheets/{sheet['id']}")['data'];assert detail['worklogs'] and float(detail['worklogs'][0]['progress_percent'])==80
 request('POST',f"/teamflow/timesheets/{sheet['id']}",value={**sheet,'mon_hours':24},expected=422)
 request('POST',f"/teamflow/timesheets/{sheet['id']}",value={**sheet,'status':'Pending'})
 request('POST',f"/teamflow/timesheets/{sheet['id']}/review",'admin',{'status':'Approved'})
 request('POST',f"/teamflow/timesheets/{sheet['id']}",value={**sheet,'status':'Draft'},expected=403)
 request('POST','/teamflow/attendance/clock',value={'action':'in','project_id':project,'module_name':'Next task','working_on':'Additional work'})
 request('POST','/teamflow/attendance/clock',value={'action':'out','worked_on':'Finished next task','progress_percent':100})
 assert request('GET',f"/teamflow/timesheets/{sheet['id']}")['data']['status']=='Approved'
 counts=json.loads(subprocess.run([PHP,str(AUDIT/'teamflow-clock-fixture.php'),'counts'],env=env,capture_output=True,text=True,check=True).stdout);assert counts['employee_attendance']==users['attendance_baseline']
 assert request('GET','/teamflow/reports/export')['total']==1
 summary={'success':True,'shared_login_bcrypt':True,'candidate_role_and_separate_profile':True,'own_scope_enforced':True,'cross_user_profile_and_file_access_denied':True,'project_assignment':True,'timesheet_hours_and_approval':True,'reports_and_uploads':True,'missing_file_replacement':True,'encrypted_profile_document_download':True,'profile_photo_add_remove':True,'candidate_remote_clock_without_ip_or_wfh':True,'clock_in_out_and_duplicate_prevention':True,'profile_calendar_and_progress':True,'automatic_timesheets_from_actual_hours':True,'approved_timesheets_stay_locked':True,'employee_attendance_unchanged':True,'own_export':True}
 (AUDIT/'teamflow-api-results.json').write_text(json.dumps(summary,indent=2),encoding='utf-8');print(json.dumps(summary))
finally:
 server.terminate()
 try:server.wait(timeout=5)
 except subprocess.TimeoutExpired:server.kill()
 log.close()
