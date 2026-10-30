import {workshopDay,createWorkshopWorkbook} from './workshopTools';
jest.mock('../api/workshopApi');
test('keeps the meeting date independent of browser timezone',()=>{expect(workshopDay('2026-10-30')).toBe('Friday');expect(workshopDay('')).toBe('');});
test('exports date and day first and preserves complete attendees and remarks',async()=>{
 const row={meeting_date:'2026-10-30',day:'Friday',team_name:'Bench Sales',topic:'Weekly learning',presenter_name:'Alex',attendees:[{name:'Alex'},{name:'Sam'}],remarks:'Full meeting notes',photos:[],created_by_name:'HR',created_at:'2026-10-30 10:00:00',updated_at:'2026-10-30 10:00:00'};
 const {book}=await createWorkshopWorkbook([row],{search:'Weekly'},false);const sheet=book.getWorksheet('Workshop meetings');expect(sheet.getRow(6).getCell(1).value).toBe('Date');expect(sheet.getRow(6).getCell(2).value).toBe('Day');expect(sheet.getRow(7).getCell(6).value).toBe('Alex\nSam');expect(sheet.getRow(7).getCell(7).value).toBe('Full meeting notes');expect(sheet.views[0].ySplit).toBe(6);expect(sheet.getRow(6).values).not.toContain('Created (UTC)');expect(sheet.getRow(6).values).not.toContain('Updated (UTC)');expect(sheet.columnCount).toBe(9);expect(book.getWorksheet('Attendee details').rowCount).toBe(3);expect(book.getWorksheet('Attendee details').getCell('F3').value).toBe('Sam');
 const buffer=await book.xlsx.writeBuffer();expect(buffer.byteLength).toBeGreaterThan(1000);
});
