const {_electron}=require('@playwright/test');
const cloudWindows=process.env.GITHUB_ACTIONS==='true'&&process.env.CI==='true';
module.exports={
 cloudWindows,
 async screenshot(app,page,file){
  await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
  // Native capture explicitly keeps hidden windows hidden and wakes only rendering.
  const png=await app.evaluate(async({BrowserWindow})=>{
   const image=await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined,{stayHidden:true,stayAwake:true});
   if(image.isEmpty())throw Error('Empty background screenshot');
   return image.toPNG().toString('base64');
  });
  await require('node:fs/promises').writeFile(file,Buffer.from(png,'base64'));
 },
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
