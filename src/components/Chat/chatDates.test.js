import {chatDate,chatDateKey,chatDateLabel,chatTimeLabel} from './chatDates';
const now=new Date(2026,10,17,12);
test('separates today, yesterday and older SQL dates instead of labeling everything Today',()=>{
 expect(chatDateLabel('2026-11-17 09:30:00',now)).toBe('Today');
 expect(chatDateLabel('2026-11-16 10:30:00',now)).toBe('Yesterday');
 expect(chatDateLabel('2026-11-12 10:00:00',now)).not.toMatch(/Today|Yesterday/);
 expect(chatDateKey(new Date(2026,10,17))).toBe('2026-11-17');
});
test('handles month/year boundaries using calendar days',()=>{
 expect(chatDateLabel('2025-12-31 10:00:00',new Date(2026,0,1,0,1))).toBe('Yesterday');
 expect(chatDateLabel('2026-10-31 10:00:00',new Date(2026,10,1))).toBe('Yesterday');
 expect(chatDateLabel('2025-01-03 10:00:00',now)).toContain('2025');
});
test('resolves Eastern SQL timestamps before applying the viewer calendar',()=>{
 expect(chatDate('2026-11-17 10:15:00').toISOString()).toBe('2026-11-17T15:15:00.000Z');
 expect(chatDate('2026-07-17 10:15:00').toISOString()).toBe('2026-07-17T14:15:00.000Z');
 expect(chatDate('2026-03-08 01:30:00').toISOString()).toBe('2026-03-08T06:30:00.000Z');
 expect(chatDate('2026-03-08 03:30:00').toISOString()).toBe('2026-03-08T07:30:00.000Z');
 expect(chatDateLabel('2026-11-16 23:30:00',new Date('2026-11-17T04:35:00Z'))).toBe(chatDateLabel('2026-11-17T04:30:00Z',new Date('2026-11-17T04:35:00Z')));
 expect(chatDate('2026-02-30 10:00:00')).toBeNull();
});
test('preserves Date objects and ISO offsets and handles missing timestamps honestly',()=>{
 const date=new Date('2026-11-16T20:00:00Z');expect(chatDate(date).getTime()).toBe(date.getTime());
 expect(chatDate('2026-11-17T01:30:00+05:30').getTime()).toBe(date.getTime());
 for(const value of [null,undefined,'','invalid',new Date(NaN)]){expect(chatDateLabel(value,now)).toBe('Date unavailable');expect(chatDateKey(value)).toBe('unknown');}
 expect(chatTimeLabel('bad')).toBe('—');
});
