import {act,configure,fireEvent,render,screen,waitFor} from '@testing-library/react';
import ChatWorkspace from './ChatWorkspace';
import * as api from '../../api/chatApi';
configure({asyncUtilTimeout:5000});
jest.setTimeout(15000);
const mockParams=new URLSearchParams(),mockSetParams=jest.fn();
jest.mock('react-router-dom',()=>({useSearchParams:()=>[mockParams,mockSetParams]}),{virtual:true});
jest.mock('../../auth/PermissionContext',()=>({usePermissions:()=>({user:{id:1},can:()=>true})}));
jest.mock('../Discussion/NewDiscussionModal',()=>()=>null);
jest.mock('../../api/chatApi',()=>({getConversations:jest.fn(),getMessages:jest.fn(),getConversationMembers:jest.fn(),markRead:jest.fn(),sendMessage:jest.fn()}));
const stamp=offset=>{const d=new Date();d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} 10:00:00`;};
const row=(id,offset,body)=>({id,sender_id:2,sender_name:'Alex Morgan',status:'active',body,created_at:stamp(offset)});
beforeEach(()=>{jest.clearAllMocks();api.getConversations.mockResolvedValue([{id:4,name:'Alex Morgan',type:'direct',last_message:'Latest update',last_message_at:stamp(0)}]);api.getMessages.mockResolvedValue([row(1,-5,'Older project update'),row(2,-1,'Yesterday project update'),row(3,0,'Current project update')]);api.getConversationMembers.mockResolvedValue([{user_id:2,nick_name:'Alex Morgan',role:'member'}]);api.markRead.mockResolvedValue({});api.sendMessage.mockResolvedValue({});});
test('renders separate day headings with readable full timestamp tooltips',async()=>{
 const {container}=render(<ChatWorkspace/>);await screen.findByText('Older project update');const dates=[...container.querySelectorAll('.chat-date-separator')].map(n=>n.textContent);expect(dates).toHaveLength(3);expect(dates.slice(-2)).toEqual(['Yesterday','Today']);expect(dates[0]).not.toMatch(/Today|Yesterday/);expect(container.querySelector('.chat-message time')).toHaveAttribute('datetime');
});
test('search filters loaded messages without changing the conversation',async()=>{
 render(<ChatWorkspace/>);await screen.findByText('Older project update');fireEvent.click(screen.getByRole('button',{name:'Search messages'}));fireEvent.change(screen.getByRole('textbox',{name:'Search this conversation'}),{target:{value:'Yesterday project'}});expect(screen.getByText('Yesterday project update')).toBeInTheDocument();expect(screen.queryByText('Older project update')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Close message search'}));expect(screen.getByText('Older project update')).toBeInTheDocument();
});
test('loads earlier history without losing it on subsequent polling',async()=>{
 jest.useFakeTimers();try{const latest=Array.from({length:50},(_,i)=>row(i+51,0,`Update ${i+51}`));api.getMessages.mockResolvedValueOnce(latest).mockResolvedValueOnce([row(50,-1,'Earlier history')]).mockResolvedValue(latest);render(<ChatWorkspace/>);fireEvent.click(await screen.findByRole('button',{name:'Load earlier messages'}));await screen.findByText('Earlier history');await act(async()=>{jest.advanceTimersByTime(4000);});expect(screen.getByText('Earlier history')).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Load earlier messages'})).toBeNull();}finally{jest.useRealTimers();}
});
test('ignores a slow response from a conversation that has been left',async()=>{
 let finish;api.getConversations.mockResolvedValue([{id:4,name:'Alex Morgan',type:'direct'},{id:5,name:'Jamie Lee',type:'direct'}]);api.getMessages.mockImplementation(id=>id===4?new Promise(resolve=>{finish=resolve;}):Promise.resolve([row(9,0,'Jamie message')]));render(<ChatWorkspace/>);fireEvent.click(await screen.findByRole('button',{name:/Jamie Lee/}));await screen.findByText('Jamie message');await act(async()=>finish([row(1,0,'Old conversation response')]));expect(screen.queryByText('Old conversation response')).toBeNull();expect(screen.getByText('Jamie message')).toBeInTheDocument();
});
test('incoming messages do not interrupt reading older history',async()=>{
 jest.useFakeTimers();try{const {container}=render(<ChatWorkspace/>);await screen.findByText('Older project update');const viewport=container.querySelector('.chat-messages');Object.defineProperties(viewport,{scrollHeight:{configurable:true,value:2400},clientHeight:{configurable:true,value:400}});viewport.scrollTop=100;fireEvent.scroll(viewport);api.getMessages.mockResolvedValue([row(1,-5,'Older project update'),row(2,-1,'Yesterday project update'),row(3,0,'Current project update'),row(4,0,'New incoming message')]);await act(async()=>{jest.advanceTimersByTime(4000);});await waitFor(()=>expect(screen.getByText('New incoming message')).toBeInTheDocument());expect(viewport.scrollTop).toBe(100);fireEvent.click(screen.getByRole('button',{name:/Jump to latest/}));expect(viewport.scrollTop).toBe(2400);}finally{jest.useRealTimers();}
});
test('relative dates refresh when a conversation remains open past midnight',async()=>{
 jest.useFakeTimers();jest.setSystemTime(new Date(2026,10,17,23,59));try{api.getMessages.mockResolvedValue([row(1,0,'Late evening update')]);const {container}=render(<ChatWorkspace/>);await screen.findByText('Late evening update');expect(container.querySelector('.chat-date-separator')).toHaveTextContent('Today');jest.setSystemTime(new Date(2026,10,18,0,1));act(()=>window.dispatchEvent(new Event('focus')));expect(container.querySelector('.chat-date-separator')).toHaveTextContent('Yesterday');}finally{jest.useRealTimers();}
});
test('sizes the chat above a fixed mobile navigation bar',async()=>{
 const originalWidth=window.innerWidth,originalHeight=window.innerHeight,originalPoint=document.elementFromPoint;
 Object.defineProperties(window,{innerWidth:{configurable:true,value:390},innerHeight:{configurable:true,value:844}});
 const nav=document.createElement('nav');nav.style.position='fixed';document.body.appendChild(nav);document.elementFromPoint=()=>nav;
 const assistant=document.createElement('aside');assistant.className='app-assistant';assistant.innerHTML='<button class="app-assistant-launch">Assistant</button>';
 const rect=jest.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(){return this===nav?{top:768,bottom:844,width:390,height:76}:this.classList.contains('app-assistant-launch')?{top:690,bottom:750,width:60,height:60}:{top:240,bottom:900,width:360,height:660};});
 try{const {container}=render(<ChatWorkspace/>);await screen.findByText('Older project update');const shell=container.querySelector('.chat-shell');expect(shell.style.getPropertyValue('--chat-available-height')).toBe('516px');document.body.appendChild(assistant);fireEvent(window,new Event('resize'));await waitFor(()=>expect(shell.style.getPropertyValue('--chat-available-height')).toBe('438px'));}finally{rect.mockRestore();document.elementFromPoint=originalPoint;nav.remove();assistant.remove();Object.defineProperties(window,{innerWidth:{configurable:true,value:originalWidth},innerHeight:{configurable:true,value:originalHeight}});}
});
