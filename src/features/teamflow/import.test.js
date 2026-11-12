const {parseTeamflowDump}=require('../../../scripts/prepare_teamflow_import');
const {currentIsoWeek}=require('./config');
test('SQL import reader preserves escaped content without executing statements',()=>{
 const text="INSERT INTO `users` (`id`, `email`, `password`) VALUES (1, 'a@example.test', 'hash'); INSERT INTO `reports` (`id`,`reportText`,`reportImage`) VALUES (2,'it\\'s a quote, comma; DROP TABLE users;\\nnext',''),(3,'double ''quote''',NULL);";
 const data=parseTeamflowDump(text);expect(data.users[0].email).toBe('a@example.test');expect(data.reports[0].reportText).toBe("it's a quote, comma; DROP TABLE users;\nnext");expect(data.reports[1].reportText).toBe("double 'quote'");expect(data.reports[1].reportImage).toBeNull();
});
test('SQL import reader rejects truncated rows and invalid column counts',()=>{
 expect(()=>parseTeamflowDump("INSERT INTO `users` (`id`,`email`) VALUES (1);")).toThrow('Column mismatch');
 expect(()=>parseTeamflowDump("INSERT INTO `users` (`id`,`email`) VALUES (1,'unfinished")).toThrow();
});
test('timesheet defaults use correct ISO week-year at a year boundary',()=>{
 expect(currentIsoWeek(new Date(2021,0,1))).toEqual({year:2020,week_no:53});
 expect(currentIsoWeek(new Date(2026,10,11))).toEqual({year:2026,week_no:46});
});
