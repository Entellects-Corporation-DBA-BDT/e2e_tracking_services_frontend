"""Integration test real multipart uploads with MySQL temporary tables only."""
import argparse, copy, json, os, socket, subprocess, tempfile, time, urllib.request, urllib.error, uuid
from pathlib import Path

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--backend", default=r"C:\xampp\htdocs\E2E_Tracking")
    parser.add_argument("--php", default=r"C:\xampp\php\php.exe")
    args=parser.parse_args()
    fixture=Path(args.backend)/"tests"/"employee_collection_http_fixture.php"
    payload=json.loads(r'''{"firstname":"Test","lastname":"Candidate","birthdate":"1995-01-01","gender":"Female","address":"Test permanent address","contact_info":"1234567890","date_of_joining":"","monthly_salary":"","collection":{"schema_version":2,"email":"candidate@example.invalid","selected_role":"hr","father_name":"Test Father","father_phone":"123","mother_name":"Test Mother","mother_phone":"456","siblings":[{"name":"Sibling","relationship":"Sister","phone":"789"}],"has_experience":true,"employment":[{"id":"exp1","company":"Test Company","designation":"Developer","period":"2022-2026"},{"id":"exp2","company":"Company 2","designation":"Developer","period":"2022-2026"},{"id":"exp3","company":"Company 3","designation":"Developer","period":"2022-2026"},{"id":"exp4","company":"Company 4","designation":"Developer","period":"2022-2026"},{"id":"exp5","company":"Company 5","designation":"Developer","period":"2022-2026"}],"education":[{"id":"edu1","degree":"B.Tech","college":"Test College","branch":"CSE","passing_year":"2020"},{"id":"edu2","degree":"Intermediate / 12th Class","college":"Test Junior College","branch":"MPC","passing_year":"2016"}],"certifications":[{"id":"cert1","name":"Test Certification","issuer":"Test Issuer","year":"2023"},{"id":"cert2","name":"Second Certification","issuer":"Second Issuer","year":"2024"}],"references":[{"id":"ref1","name":"Test Reference","phone":"123456","email":"ref@example.invalid","relationship":"Former manager","organization":"Test Company"}],"achievements":"Test Award","declaration":{"accepted":true},"review":{"reviewed_by":"Forged reviewer","date":"2026-10-02"}}}''')
    with tempfile.TemporaryDirectory(prefix="e2e-collection-test-") as folder:
        directory=Path(folder)
        public=directory/"public";public.mkdir()
        (public/"index.php").write_text("<?php if(str_starts_with($_SERVER['REQUEST_URI'],'/employees/')) {require "+json.dumps(str(Path(args.backend)/"index.php").replace("\\","/"))+";exit;} require "+json.dumps(str(fixture).replace("\\","/"))+";",encoding="utf-8")
        with socket.socket() as sock:
            sock.bind(("127.0.0.1",0));port=sock.getsockname()[1]
        env=os.environ.copy();env["E2E_COLLECTION_TEST_MODE"]="1";env["EMPLOYEE_DOCUMENT_DIR"]=str(directory/"private")
        env["MAIL_CREDENTIAL_KEY"]="isolated-regression-key-with-at-least-32-chars"
        log=open(directory/"server.log","w+",encoding="utf-8")
        process=subprocess.Popen([args.php,"-S","127.0.0.1:"+str(port),"-t",str(public)],
          env=env,stdout=log,stderr=log,creationflags=getattr(subprocess,"CREATE_NO_WINDOW",0))
        try:
            for _ in range(100):
                if process.poll() is not None: raise RuntimeError("PHP test server failed")
                try:
                    with socket.create_connection(("127.0.0.1",port),timeout=.1):break
                except OSError:time.sleep(.05)
            def request(mode, data, files):
                data=copy.deepcopy(data)
                if mode!="truncated_upload": data["document_upload_count"]=len(files)
                boundary="e2e"+uuid.uuid4().hex;parts=[]
                def part(name, body, filename=None, mime=None):
                    head="--"+boundary+'\r\nContent-Disposition: form-data; name="'+name+'"'
                    if filename:head+='; filename="'+filename+'"'
                    if mime:head+='\r\nContent-Type: '+mime
                    parts.append((head+"\r\n\r\n").encode()+body+b"\r\n")
                part("payload",json.dumps(data).encode())
                for category,name,mime,body in files:part("documents["+category+"][]",body,name,mime)
                body=b"".join(parts)+("--"+boundary+"--\r\n").encode()
                req=urllib.request.Request("http://127.0.0.1:"+str(port)+"/?mode="+mode,data=body,
                  headers={"Content-Type":"multipart/form-data; boundary="+boundary})
                try:
                    with urllib.request.urlopen(req,timeout=30) as response:raw=response.read()
                except urllib.error.HTTPError as error:raw=error.read()
                try:result=json.loads(raw.decode("utf-8-sig"))
                except Exception:raise RuntimeError("Invalid test response: "+repr(raw))
                if not result.get("passed"):raise RuntimeError(mode+": "+json.dumps(result))
                print("PASS",mode,json.dumps(result))
            pdf=b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n"
            files=[("education_edu1_certificate","degree.pdf","application/pdf",pdf),("experience_exp1","experience.pdf","application/pdf",pdf)]
            request("success",payload,files);request("no_files",payload,[])
            request("expired",payload,files)
            invalid=copy.deepcopy(payload);invalid["collection"]["declaration"]["accepted"]=False
            request("declaration",invalid,files)
            invalid=copy.deepcopy(payload);invalid["birthdate"]="2026-02-30"
            request("invalid_date",invalid,files)
            invalid=copy.deepcopy(payload);invalid["collection"]["email"]="other@example.invalid"
            request("email_mismatch",invalid,files)
            request("disguised_file",payload,[("education_edu1_certificate","malicious.pdf","application/pdf",b"<?php echo 'bad'; ?>")])
            request("invalid_category",payload,[("unknown","degree.pdf","application/pdf",pdf)])
            request("oversize",payload,[("education_edu1_certificate","large.pdf","application/pdf",pdf+b"x"*(6*1048576))])
            request("storage_failure",payload,files)
            request("database_failure",payload,files)
            invalid=copy.deepcopy(payload);invalid["document_upload_count"]=3
            request("truncated_upload",invalid,files)
            invalid=copy.deepcopy(payload);invalid["collection"]["education"][1]["id"]="edu1"
            request("duplicate_row_ids",invalid,files)
            invalid=copy.deepcopy(payload);invalid["collection"]["education"][0]["passing_year"]="2500"
            request("invalid_year",invalid,files)
            invalid=copy.deepcopy(payload);invalid["collection"]["references"][0]["email"]="not-email"
            request("invalid_reference",invalid,files)
            invalid=copy.deepcopy(payload);invalid["collection"]["has_experience"]=False
            request("no_experience",invalid,files[:1])
            try:
                urllib.request.urlopen("http://127.0.0.1:"+str(port)+"/employees/7/documents/"+"a"*32,timeout=10)
                raise RuntimeError("Unauthenticated document download was allowed")
            except urllib.error.HTTPError as error:
                if error.code!=401:raise RuntimeError("Expected download authentication rejection, got "+str(error.code)+": "+error.read().decode())
                print("PASS unauthenticated document download rejected by the real API route")
        except Exception:
            log.flush();log.seek(0);print(log.read());raise
        finally:
            process.terminate()
            try:process.wait(timeout=10)
            except subprocess.TimeoutExpired:process.kill();process.wait()
            log.close()
if __name__=="__main__":main()
