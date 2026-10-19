import {render,screen,fireEvent,waitFor,configure} from '@testing-library/react';
import DocumentCheck from './DocumentCheck';
import {validateDocumentFile} from '../../features/documentCheck/documentReview';
import {createLocalOcrSession} from '../../features/documentCheck/localOcr';
jest.mock('react-router-dom',()=>({Link:({to,children,...props})=><a href={to} {...props}>{children}</a>}),{virtual:true});
jest.mock('../../auth/PermissionContext',()=>({usePermissions:()=>({getResource:()=>({route:'/dashboard/recruiting'})})}));
jest.mock('../../features/documentCheck/documentReview',()=>({...jest.requireActual('../../features/documentCheck/documentReview'),validateDocumentFile:jest.fn()}));
jest.mock('../../features/documentCheck/localOcr',()=>({createLocalOcrSession:jest.fn()}));
jest.setTimeout(30000);
configure({asyncUtilTimeout:10000});
beforeEach(()=>{jest.clearAllMocks();validateDocumentFile.mockResolvedValue('application/pdf');Object.defineProperty(window,'isSecureContext',{value:true,configurable:true});Object.defineProperty(window,'crypto',{value:{subtle:{},randomUUID:()=> 'file-1'},configurable:true});URL.createObjectURL=jest.fn(()=> 'blob:fixture');URL.revokeObjectURL=jest.fn();});
test('displays privacy limits and leaves run checks disabled without documents',()=>{
 render(<DocumentCheck/>);expect(screen.getByText(/Document review, not an authenticity verdict/)).toBeInTheDocument();expect(screen.getByRole('button',{name:'Run document checks'})).toBeDisabled();expect(screen.getByLabelText('Upload I-94 record')).toBeInTheDocument();
});
test('runs local review, masks numbers and clears all result details',async()=>{
 const close=jest.fn().mockResolvedValue();createLocalOcrSession.mockReturnValue({read:jest.fn().mockResolvedValue({text:'Full Name: Alex Example\nDOB: 01/14/1990\nLicense Number: SAMPLE123\nExpiration Date: 12/31/2030',pages:1,fingerprint:'abc',confidence:91,preview:new Blob()}),close});
 render(<DocumentCheck/>);
 fireEvent.change(screen.getByLabelText('Upload Driving licence'),{target:{files:[new File(['%PDF-1.7 sample'],'sample.pdf',{type:'application/pdf'})]}});
 await screen.findByText('sample.pdf');fireEvent.click(screen.getByRole('button',{name:'Run document checks'}));
 await screen.findByText('Authenticity: not verified');expect(screen.queryByText('SAMPLE123')).not.toBeInTheDocument();expect(screen.queryByAltText('First-page document preview')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Show sensitive values'}));expect(screen.getByText('SAMPLE123')).toBeInTheDocument();expect(screen.getByAltText('First-page document preview')).toBeInTheDocument();
 await waitFor(()=>expect(close).toHaveBeenCalled());
 fireEvent.click(screen.getByRole('button',{name:'Clear session'}));expect(screen.queryByText('Authenticity: not verified')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Run document checks'})).toBeDisabled();
});


test('clears reference-only data before any file has been selected',()=>{
 render(<DocumentCheck/>);fireEvent.change(screen.getByLabelText('Candidate full name'),{target:{value:'Example Person'}});
 expect(screen.getByRole('button',{name:'Clear session'})).not.toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Clear session'}));expect(screen.getByLabelText('Candidate full name').value).toBe('');
});
test('cancellation closes the OCR session and never presents partial results',async()=>{
 const close=jest.fn().mockResolvedValue();
 createLocalOcrSession.mockImplementation((progress,signal)=>({read:()=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')))),close}));
 render(<DocumentCheck/>);fireEvent.change(screen.getByLabelText('Upload Driving licence'),{target:{files:[new File(['%PDF-1.7'],'sample.pdf',{type:'application/pdf'})]}});
 await screen.findByText('sample.pdf');fireEvent.click(screen.getByRole('button',{name:'Run document checks'}));
 fireEvent.click(await screen.findByRole('button',{name:'Cancel'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Review cancelled');await waitFor(()=>expect(close).toHaveBeenCalled());expect(screen.queryByText('Authenticity: not verified')).not.toBeInTheDocument();
});
