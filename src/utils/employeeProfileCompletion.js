import {normalizeCollection} from "./employeeCollection";
export function employeeProfileCompletion(employee){
 const c=normalizeCollection(employee.collection),p=employee.payroll_profile||{},checks=[];
 const add=(label,value,section)=>checks.push({label,complete:Boolean(String(value??"").trim())&&value!=="0000-00-00",section});
 [["First name",employee.firstname],["Last name",employee.lastname],["Phone number",employee.contact_info],["Email",c.email||employee.payroll_email],["Birth date",employee.birthdate],["Gender",employee.gender]].forEach(([label,value])=>add(label,value,"profile-details"));
 [["Father's name",c.father_name],["Mother's name",c.mother_name]].forEach(([label,value])=>add(label,value,"profile-family"));
 [["Bank name",p.bank_name],["Bank account number",p.bank_account_number],["IFSC code",p.ifsc_code],["PAN",p.pan_number]].forEach(([label,value])=>add(label,value,"profile-bank"));
 const doc=(label,category)=>add(label,c.documents.some(d=>d.category===category)?"uploaded":"","profile-documents");
 if(!c.education.length)add("Add highest qualification","","profile-education");
 c.education.forEach((row,i)=>{const name=`Qualification ${i+1}`;[["degree", "qualification"],["college","college / school"],["passing_year","passing year"]].forEach(([key,label])=>add(`${name}: ${label}`,row[key],"profile-education"));doc(`${name}: certificate`,`education_${row.id}_certificate`);doc(`${name}: marksheets`,`education_${row.id}_marksheets`)});
 if(c.has_experience)c.employment.forEach((row,i)=>{[["company","company"],["designation","designation"],["period","employment period"]].forEach(([key,label])=>add(`Experience ${i+1}: ${label}`,row[key],"profile-experience"));doc(`Experience ${i+1}: letter`,`experience_${row.id}`)});
 c.certifications.forEach((row,i)=>{add(`Certification ${i+1}: name`,row.name,"profile-certifications");doc(`Certification ${i+1}: document`,`certification_${row.id}`)});
 const completed=checks.filter(item=>item.complete).length;
 return {completed,total:checks.length,percentage:Math.round(completed/checks.length*100),remaining:checks.filter(item=>!item.complete)};
}
