import {collectionRequest,emptyCollection,normalizeCollection,validateCollectionFiles} from "./employeeCollection";
test("legacy rows and documents retain their original company association",()=>{
 const value=normalizeCollection({employment:[{company:""},{company:"Second Company",designation:"Developer",period:"2020-2022"}],computer_certifications:["Certificate"],documents:[{id:"a",category:"experience_2",name:"letter.pdf"}],declaration:{signature:"Signed"}});
 expect(value.employment).toHaveLength(1);expect(value.employment[0].id).toBe("legacy2");expect(value.documents[0].category).toBe("experience_legacy2");expect(value.certifications[0].name).toBe("Certificate");expect(value.declaration.signature).toBe("Signed");
});
test("normalization preserves all dynamic entries beyond the old three-row limit",()=>{
 const collection=emptyCollection();collection.employment=Array.from({length:6},(_,i)=>({id:"row"+i,company:"Company "+i}));collection.has_experience=true;
 expect(normalizeCollection(collection).employment).toHaveLength(6);expect(emptyCollection().employment).toEqual([]);expect(emptyCollection().has_experience).toBe(false);
});
test("rejects invalid file types and excessive total size",()=>{
 expect(validateCollectionFiles({a:[new File(["bad"],"script.php",{type:"application/x-php"})]})).toMatch(/choose PDF/);
 const file=new File([new Uint8Array(16)],"degree.pdf",{type:"application/pdf"});expect(validateCollectionFiles({a:[file,file]},{max_file_bytes:20,max_total_bytes:30})).toMatch(/total/);
});
test("multipart keeps stable row IDs and removes unchecked experience",()=>{
 const collection=emptyCollection();collection.employment=[{id:"draft",company:"Draft"}];
 const file=new File(["pdf"],"degree.pdf",{type:"application/pdf"}),key="education_"+collection.education[0].id+"_certificate";
 const request=collectionRequest({collection},{[key]:[file,file]});expect(request.getAll("documents["+key+"][]")).toHaveLength(2);const payload=JSON.parse(request.get("payload"));
 expect(payload.document_upload_count).toBe(2);expect(payload.collection.education[0].id).toBe(collection.education[0].id);expect(payload.collection.employment).toEqual([]);
});
