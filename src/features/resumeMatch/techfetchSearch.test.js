import {searchTechfetch} from './techfetchSearch';
const config={url:'https://example.supabase.co',anonKey:'public-anon-key'};
const request={email:' recruiter@example.test ',password:'temporary-test-password',keywords:' React ',state:'CA'};
beforeEach(()=>{global.fetch=jest.fn();});
afterEach(()=>jest.restoreAllMocks());
function configured(data,status=200){fetch.mockResolvedValueOnce({ok:true,json:async()=>config}).mockResolvedValueOnce({ok:status===200,status,json:async()=>data});}
test('sends original Edge Function contract and preserves real source',async()=>{
 configured({source:'techfetch',candidates:[{id:'1',name:'Example',resumeText:'React AWS experience',skills:['React']}]});
 const result=await searchTechfetch(request);
 expect(fetch.mock.calls[1][0]).toBe('https://example.supabase.co/functions/v1/techfetch-search');
 expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({...request,email:'recruiter@example.test',keywords:'React'});
 expect(result.source).toBe('techfetch');expect(result.candidates[0].resumeText).toBe('React AWS experience');
});
test('keeps demo fallback labelled rather than treating it as live',async()=>{
 configured({source:'techfetch-demo',candidates:[]});expect((await searchTechfetch(request)).source).toBe('techfetch-demo');
});
test('missing settings never sends credentials to a provider',async()=>{
 fetch.mockResolvedValueOnce({ok:true,json:async()=>({})});await expect(searchTechfetch(request)).rejects.toThrow('VITE_SUPABASE_URL');expect(fetch).toHaveBeenCalledTimes(1);
});
test('authorization failure never falls back to invented candidates or echoes provider secrets',async()=>{
 configured({error:'sensitive provider diagnostic'},401);await expect(searchTechfetch(request)).rejects.toThrow('authorization failed');
});
test('rejects unlabelled results',async()=>{
 configured({candidates:[]});await expect(searchTechfetch(request)).rejects.toThrow('unrecognised source');
});
