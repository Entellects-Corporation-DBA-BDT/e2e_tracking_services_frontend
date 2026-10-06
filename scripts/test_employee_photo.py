"""Profile photo regression test: temporary MySQL table and private test directory only."""
import base64,json,os,socket,subprocess,tempfile,time,urllib.request,urllib.error,uuid
from pathlib import Path
backend=Path(r"C:\xampp\htdocs\E2E_Tracking")
php=r"C:\xampp\php\php.exe"
with tempfile.TemporaryDirectory(prefix="e2e-photo-test-") as folder:
    directory=Path(folder);public=directory/"public";public.mkdir()
    real=json.dumps(str(backend/"index.php").replace("\\","/"));fixture=json.dumps(str(backend/"tests/employee_photo_http_fixture.php").replace("\\","/"))
    (public/"index.php").write_text("<?php if(str_starts_with($_SERVER['REQUEST_URI'],'/employees/')){require "+real+";exit;}require "+fixture+";",encoding="utf-8")
    with socket.socket() as sock:sock.bind(("127.0.0.1",0));port=sock.getsockname()[1]
    env=os.environ.copy();env.update(E2E_COLLECTION_TEST_MODE="1",EMPLOYEE_DOCUMENT_DIR=str(directory/"private"),MAIL_CREDENTIAL_KEY="isolated-regression-key-with-at-least-32-chars")
    with open(directory/"server.log","w+",encoding="utf-8") as log:
        process=subprocess.Popen([php,"-S",f"127.0.0.1:{port}","-t",str(public)],env=env,stdout=log,stderr=log,creationflags=getattr(subprocess,"CREATE_NO_WINDOW",0))
        try:
            for _ in range(100):
                try:
                    with socket.create_connection(("127.0.0.1",port),timeout=.1):break
                except OSError:time.sleep(.05)
            boundary="e2e"+uuid.uuid4().hex;parts=[]
            png=base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCZkAAAAASUVORK5CYII=")
            for name,body in [("photo",png),("invalid",b"<?php echo 1; ?>"),("large",png+b"x"*2097152)]:
                parts.append((f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="portrait.png"\r\nContent-Type: image/png\r\n\r\n').encode()+body+b"\r\n")
            body=b"".join(parts)+(f"--{boundary}--\r\n").encode()
            req=urllib.request.Request(f"http://127.0.0.1:{port}/",data=body,headers={"Content-Type":"multipart/form-data; boundary="+boundary})
            with urllib.request.urlopen(req,timeout=30) as response:result=json.loads(response.read())
            assert result["passed"],result
            print("PASS",json.dumps(result))
            for method in ["GET","POST"]:
                req=urllib.request.Request(f"http://127.0.0.1:{port}/employees/7/photo",method=method,data=body if method=="POST" else None,headers={"Content-Type":"multipart/form-data; boundary="+boundary})
                try:urllib.request.urlopen(req,timeout=10);raise AssertionError("Photo endpoint accepted an unauthenticated request")
                except urllib.error.HTTPError as error:assert error.code==401,(error.code,error.read());print("PASS unauthenticated",method,"photo request rejected")
        except Exception:
            log.flush();log.seek(0);print(log.read());raise
        finally:
            process.terminate()
            try:process.wait(timeout=10)
            except subprocess.TimeoutExpired:process.kill();process.wait()
