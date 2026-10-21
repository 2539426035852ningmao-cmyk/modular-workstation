const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const writeAtomic = require('write-file-atomic');
const fail = code => {throw new Error(code);};
const plain = value => value && Object.getPrototypeOf(value) === Object.prototype;
const modes = ['system','light','dark'];
class AppearanceStore {
 constructor(directory, writer = writeAtomic) {
  this.file=path.join(directory,'appearance-v1.json');this.writer=writer;this.value=null;this.blocked=null;
 }
 // The main process runs these methods on the existing persistence queue.
 async load() {
  if (this.value && !this.blocked) return {...this.value};
  try {
   if ((await fs.stat(this.file)).size>4096) fail('CORRUPT');
   const bytes=await fs.readFile(this.file,'utf8');let value;
   try {value=JSON.parse(bytes);} catch {fail('CORRUPT');}
   if (plain(value) && Number.isSafeInteger(value.version) && value.version>=0 && value.version!==1) fail('UNSUPPORTED');
   if (!plain(value)||Object.keys(value).sort().join()!=='theme,version'||value.version!==1||!modes.includes(value.theme)) fail('CORRUPT');
   this.value=value;this.blocked=null;
  } catch(error) {
   if (error.code==='ENOENT') {this.value={version:1,theme:'system'};this.blocked=null;}
   else {this.blocked=['CORRUPT','UNSUPPORTED'].includes(error.message)?error.message:'READ_FAILED';fail(this.blocked);}
  }
  return {...this.value};
 }
 async change(command) {
  if (!plain(command)||Object.keys(command).join()!=='theme'||!modes.includes(command.theme)) fail('INVALID');
  if (this.blocked||!this.value) fail(this.blocked||'NOT_READY');
  const next={version:1,theme:command.theme};
  try {await fs.mkdir(path.dirname(this.file),{recursive:true});await this.writer(this.file,JSON.stringify(next,null,2)+'\n',{encoding:'utf8',mode:0o600,fsync:true});}
  catch {fail('SAVE_FAILED');}
  this.value=next;return {...next};
 }
 async recover() {
  if (this.blocked!=='CORRUPT') fail('INVALID');
  await fs.copyFile(this.file,path.join(path.dirname(this.file),`appearance-v1.preserved-${randomUUID()}.json`),fs.constants.COPYFILE_EXCL);
  this.value={version:1,theme:'system'};this.blocked=null;
  try {return await this.change({theme:'system'});} catch(error) {this.value=null;this.blocked='CORRUPT';throw error;}
 }
}
module.exports={AppearanceStore};
