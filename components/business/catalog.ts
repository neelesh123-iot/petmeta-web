export const screens = [
  'Splash', 'Welcome', 'Mobile sign in', 'OTP verification', 'Business categories', 'Business identity', 'Branch details', 'Business activities', 'Required documents', 'Document upload', 'Registration review', 'Application status', 'Home', 'Manage', 'Business profile', 'Branch management', 'Pet listings', 'Add or edit pet', 'Pet listing details', 'Pet enquiries', 'Reservation & handover', 'Product catalog', 'Add or edit product', 'Inventory & batches', 'Orders', 'Order details', 'Hospital profile', 'Facility details', 'Doctors', 'Add or invite doctor', 'Doctor availability', 'Appointments', 'Appointment details', 'Messages', 'Chat', 'Notifications', 'Finance & reports', 'Team & permissions', 'Account', 'Help & support', 'Customer preview', 'Design system',
];
export type FieldSpec = { label: string; type?: string; options?: string[]; value?: string; optional?: boolean; help?: string };
const f = (label: string, value = '', type = 'text', optional = false): FieldSpec => ({ label, value, type, optional });
const select = (label: string, options: string[]): FieldSpec => ({ label, options });
export const forms: Record<number, { intro: string; groups: { title: string; fields: FieldSpec[] }[]; action: string; next: number }> = {
  6: { intro: 'A strong business starts with the right details.', groups: [{title:'Your business', fields:[f('Legal business name'), f('Public business name'), select('Business structure',['Sole proprietorship','Partnership','Private limited','Other']), f('Authorized representative'), f('Mobile number','','tel'), f('Email','','email')]}], action:'Save & continue', next:7 },
  7: { intro:'Let pet parents find their new favourite place.', groups:[{title:'Branch location',fields:[f('Branch name'),f('Complete address'),select('State or union territory',['Telangana','Andhra Pradesh','Karnataka','Maharashtra','Other']),f('District'),f('City'),f('PIN code','','text'),f('Map latitude','','number'),f('Map longitude','','number')]},{title:'Hours & contact',fields:[f('Opening time','09:00','time'),f('Closing time','20:00','time'),f('Customer contact number','','tel')]}], action:'Save & continue',next:8 },
  10: {intro:'Your evidence stays private. Uploading does not mean verification.',groups:[{title:'Document information',fields:[select('Document type',['Business identity evidence','Activity permission evidence','Professional registration','Supplier evidence','Other']),f('Holder name'),f('Issuing authority'),f('Registration number'),f('Issue date','','date'),f('Expiry date','','date',true),f('Branch or activity covered')]}],action:'Save document locally',next:9},
  18: {intro:'Tell their story. New listings stay hidden until reviewed and approved.',groups:[{title:'Meet your pet',fields:[f('Pet name'),select('Species',['Dog','Cat','Rabbit','Bird','Fish','Other']),f('Breed'),select('Sex',['Female','Male','Unknown']),f('Date of birth','','date'),f('Price (₹)','','number'),f('Description','','textarea')]},{title:'Health & source • private',fields:[f('Health information','','textarea'),f('Vaccination details','','textarea'),f('Source details','','textarea')]}],action:'Save listing draft',next:17},
  23: {intro:'Clear labels help pet parents choose with confidence.',groups:[{title:'Product essentials',fields:[f('Product name'),f('Brand'),f('Manufacturer or importer'),select('Species',['Dog','Cat','All pets']),select('Life stage',['Puppy / kitten','Adult','Senior','All life stages']),f('Pack size'),f('Ingredients','','textarea'),f('Feeding information','','textarea')]},{title:'Price & sourcing',fields:[f('Selling price (₹)','','number'),f('Tax information','', 'text',true),f('Supplier evidence reference'),f('Activity-specific permission reference','','text',true)]}],action:'Save product draft',next:22},
  28: {intro:'Facility permissions and doctor credentials are reviewed separately.',groups:[{title:'Facility information',fields:[f('Ownership'),select('Facility type',['Clinic','Hospital','Diagnostic centre']),f('Responsible veterinarian'),f('Address'),f('Services','','textarea'),f('Equipment','','textarea'),f('Operating hours')]},{title:'Activity-specific evidence',fields:[f('Waste-management evidence','','text',true),f('Pharmacy permission reference','','text',true),f('Equipment / local permission','','text',true)]}],action:'Save facility draft',next:27},
  30: {intro:'Doctors must accept an affiliation and pass credential checks before becoming bookable.',groups:[{title:'Professional details',fields:[f('Professional name'),f('Contact email','','email'),f('Recognized qualification'),f('Institution'),f('Council'),f('Registration number'),f('Experience in years','','number'),f('Languages'),f('Practice area'),f('Consultation fee (₹)','','number')]}],action:'Save invitation draft',next:29},
  40: {intro:'A little help, whenever you need it.',groups:[{title:'Contact support',fields:[select('Category',['Registration','Documents','Listings','Orders','Appointments','Payments']),f('Description','','textarea'),f('Contact email','','email')]}],action:'Save support request draft',next:40},
};
export const categories = [ ['Grooming Salon','Grooming appointments and pet care.'], ['Pet Store','Find loving homes, manage listings.'],['Pet Food & Accessories','Everyday essentials, beautifully managed.'],['Veterinary Hospital or Clinic','Coordinate care and appointments.'],['Veterinary Doctor','Your practice, connected.'] ];
export const activityMap: Record<string,string[]> = {
 'Grooming Salon':['Grooming','Bath and brush','Haircuts'],
  'Pet Store':['Live pet sales','Breeding'], 'Pet Food & Accessories':['Food retail','Food manufacturing','Imports'], 'Veterinary Hospital or Clinic':['Consultations','Pharmacy','Diagnostics'], 'Veterinary Doctor':['Consultations','Home visits'],
};
export const pets = [
 {name:'Milo',breed:'Golden Retriever',age:'12 weeks',sex:'Male',price:28000,image:'/discovery/dog/1.webp',status:'Available',species:'Dog'},
 {name:'Luna',breed:'Persian',age:'10 weeks',sex:'Female',price:18000,image:'/discovery/cat/0.webp',status:'Reserved',species:'Cat'},
 {name:'Bruno',breed:'Beagle',age:'14 weeks',sex:'Male',price:24000,image:'/discovery/dog/4.webp',status:'Under review',species:'Dog'},
 {name:'Coco',breed:'Shih Tzu',age:'11 weeks',sex:'Female',price:26000,image:'/discovery/dog/9.webp',status:'Available',species:'Dog'},
];
export const products = [
 {name:'Adult dry dog food',brand:'Royal Canin',size:'3 kg',price:2490,stock:24,status:'Published',species:'Dog',image:'/business-assets/product-dog.jpg'},
 {name:'Ocean fish cat food',brand:'Whiskas',size:'1.2 kg',price:420,stock:5,status:'Published',species:'Cat',image:'/business-assets/product-cat.jpg'},
 {name:'Everyday walking harness',brand:'PetMeta',size:'Medium',price:899,stock:12,status:'Draft',species:'Dog',image:'/business-assets/product-harness.png'},
];
export const orders = [
 {ref:'PM-1042',name:'Ananya Reddy',items:'Royal Canin adult • 3 kg × 1',amount:2490,method:'Store pickup',time:'10:42 AM',status:'New'},
 {ref:'PM-1041',name:'Rahul Sharma',items:'Whiskas ocean fish • 1.2 kg × 2',amount:840,method:'Local delivery',time:'10:18 AM',status:'Packing'},
 {ref:'PM-1040',name:'Priya Rao',items:'Walking harness • Medium × 1',amount:899,method:'Store pickup',time:'Yesterday',status:'Completed'},
];
export const doctors = [
 {name:'Dr. Kavya Reddy',qualification:'BVSc & AH',area:'Small animal medicine',years:8,languages:'English, Telugu, Hindi',fee:650,status:'Verified',affiliation:'Accepted'},
 {name:'Dr. Arjun Rao',qualification:'MVSc',area:'Dermatology',years:5,languages:'English, Telugu',fee:800,status:'Under review',affiliation:'Pending affiliation'},
];
export const appointments = [
 {time:'10:30 AM',pet:'Max',owner:'Ananya Reddy',service:'Wellness consultation',status:'Confirmed'},
 {time:'11:15 AM',pet:'Bella',owner:'Rahul Sharma',service:'Vaccination consultation',status:'Checked in'},
 {time:'12:00 PM',pet:'Simba',owner:'Priya Rao',service:'Follow-up',status:'Completed'},
];
export const conversations = [
 {name:'Ananya Reddy',related:'Enquiry about Milo',message:'Can we visit Milo this weekend?',time:'5m',unread:2,type:'Pet Enquiries'},
 {name:'Rahul Sharma',related:'Order PM-1041',message:'Thank you! What time will it be ready?',time:'18m',unread:1,type:'Orders'},
 {name:'Priya Rao',related:'Appointment for Simba',message:'See you at the clinic tomorrow.',time:'1h',unread:0,type:'Appointments'},
];
export const money = (n:number) => `₹${n.toLocaleString('en-IN')}`;


