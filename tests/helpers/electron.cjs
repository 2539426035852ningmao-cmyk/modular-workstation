const _electron = require('./background.cjs');
const fs = require('node:fs/promises'), os = require('node:os'), path = require('node:path');
module.exports.launch = async options => {
 const profile = await fs.mkdtemp(path.join(os.tmpdir(),'workstation-ui-'));
 const app = await _electron.launch({...options,args:[...options.args,`--user-data-dir=${profile}`]});
 const close = app.close.bind(app);
 app.close = async () => {try {await close();} finally {await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}};
 return app;
};
