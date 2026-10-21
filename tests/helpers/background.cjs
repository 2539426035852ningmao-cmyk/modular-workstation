const {_electron}=require('@playwright/test');
const cloudWindows=process.env.GITHUB_ACTIONS==='true'&&process.env.CI==='true';
module.exports={
 cloudWindows,
 async launch(options){
  const app=await _electron.launch({colorScheme:null,...options,args:[...(options.args||[]),...(cloudWindows?[]:['--workstation-background'])]});
  const close=app.close.bind(app);
  app.close=async()=>{
   // A failed test must not hang on, or display, a native exit confirmation.
   await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:1});}).catch(()=>{});
   return close();
  };
  return app;
 }
};
