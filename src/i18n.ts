export type PageId = 'home' | 'workspace' | 'plugins' | 'settings';

const translations = {
  zh: {
    appearance: {"title":"外观","description":"选择适合你的显示方式","system":"跟随系统","light":"浅色","dark":"深色","loading":"正在读取或保存","notSaved":"本次选择未保存","saved":"已保存到本机","local":"仅保存在本机","corrupt":"外观记录无法读取","unsupported":"外观记录版本不支持","failed":"无法完成外观设置","kept":"原记录保留 主题未更改","retry":"重新读取","recover":"保留记录并恢复默认","confirmNote":"原记录将独立保留","confirm":"确认恢复","cancel":"取消"},
    workspace: {"open":"打开已有空间","name":"空间名称","namePlaceholder":"为新空间命名","create":"创建空间","spaces":"我的空间","empty":"创建你的第一个空间","first":"命名后即可开始","loading":"正在读取或保存","notSaved":"操作未保存","saved":"已保存到本机","local":"本机工作空间","failed":"无法完成操作","kept":"原有记录保持不变","corrupt":"记录无法读取","unsupported":"记录版本暂不支持","retry":"重新读取","recover":"保留原记录并重建","preserve":"原记录将独立保留","confirm":"确认重建","cancel":"取消","layout":"布局","standard":"标准布局","focus":"专注布局","reset":"恢复默认布局","views":"空间视图","tabs":"打开的标签","overview":"空间概览","resources":"文件与素材","close":"关闭","ready":"标签与布局将自动保存","noResources":"文件关联将在后续开放"},
    appName: '模块化工作站', prototype: '技术原型', navigation: '主导航',
    skip: '跳到主内容', context: '当前页面上下文', myStation: '我的工作站', overview: '总览',
    sections: { workspace: '文件与素材', plugins: '插件中心', settings: '外观与基础设置' },
    localSpace: '本地空间', contextNote: '更多功能逐步开放',
    searchUnavailable: '搜索尚未开放', viewWorkspace: '查看工作区', createWorkspace: '新建工作空间', installPlugin: '安装插件',
    workspaceUnavailable: '文件关联尚未开放', pluginUnavailable: '插件安装尚未开放',
    homeNote: '暂无文件与任务',
    themeLabel: '当前主题方式', systemTheme: '跟随系统', themeNote: '手动主题与偏好保存尚未开放',
    pages: {
      home: { label: '首页', title: '从这里开始创作', description: '集中管理空间与工具' },
      workspace: { label: '工作区', title: '工作区', description: '保存空间与布局' },
      plugins: { label: '插件', title: '插件', description: '插件管理尚未实现' },
      settings: { label: '设置', title: '设置', description: '外观偏好保存在本机' },
    },
    status: '本地使用无需登录', emptyLabel: '等待下一步', explore: '探索工作站',
    modules: [
      { title: '工作区', description: '集中项目与常用工具', status: '尚未创建' },
      { title: '文件与素材', description: '整理文件与创作素材', status: '即将开放' },
      { title: '工具与插件', description: '按需扩展工作站', status: '即将开放' },
    ],
  },
  en: {
    appearance: {"title":"Appearance","description":"Choose how your workstation looks","system":"Follow system","light":"Light","dark":"Dark","loading":"Reading or saving","notSaved":"Selection not saved","saved":"Saved on this device","local":"Stored on this device","corrupt":"Unable to read appearance","unsupported":"Appearance version is not supported","failed":"Unable to change appearance","kept":"Records kept and theme unchanged","retry":"Read again","recover":"Preserve and restore defaults","confirmNote":"Original records will be kept separately","confirm":"Confirm restore","cancel":"Cancel"},
    workspace: {"open":"Open saved spaces","name":"Space name","namePlaceholder":"Name your space","create":"Create space","spaces":"My spaces","empty":"Create your first space","first":"Give your space a name","loading":"Reading or saving","notSaved":"Change not saved","saved":"Saved on this device","local":"Local workspace","failed":"Unable to complete action","kept":"Previous records are unchanged","corrupt":"Unable to read records","unsupported":"Record version is not supported","retry":"Read again","recover":"Preserve and rebuild","preserve":"Original records will be kept separately","confirm":"Confirm rebuild","cancel":"Cancel","layout":"Layout","standard":"Standard","focus":"Focus","reset":"Reset layout","views":"Space views","tabs":"Open tabs","overview":"Space overview","resources":"Files and assets","close":"Close","ready":"Tabs and layout save automatically","noResources":"File linking is coming later"},
    appName: 'Modular Workstation', prototype: 'Technical prototype', navigation: 'Main navigation',
    skip: 'Skip to content', context: 'Page context', myStation: 'My workstation', overview: 'Overview',
    sections: { workspace: 'Files and assets', plugins: 'Plugin center', settings: 'Appearance and basics' },
    localSpace: 'LOCAL SPACE', contextNote: 'More features coming later',
    searchUnavailable: 'Search coming later', viewWorkspace: 'View workspace', createWorkspace: 'New workspace', installPlugin: 'Install plugin',
    workspaceUnavailable: 'Folder linking coming later', pluginUnavailable: 'Plugin installation coming later',
    homeNote: 'No files or tasks yet',
    themeLabel: 'Theme mode', systemTheme: 'Follow system', themeNote: 'Manual themes and saved preferences coming later',
    pages: {
      home: { label: 'Home', title: 'Start creating here', description: 'Keep your work in one place' },
      workspace: { label: 'Workspaces', title: 'Workspaces', description: 'Save spaces and layouts' },
      plugins: { label: 'Plugins', title: 'Plugins', description: 'Plugin management is not implemented' },
      settings: { label: 'Settings', title: 'Settings', description: 'Appearance saved on this device' },
    },
    status: 'Local use without login', emptyLabel: 'Coming later', explore: 'Explore the workstation',
    modules: [
      { title: 'Workspaces', description: 'Keep projects and tools together', status: 'Not created' },
      { title: 'Files and assets', description: 'Organize files and creative assets', status: 'Coming later' },
      { title: 'Tools and plugins', description: 'Extend your workstation as needed', status: 'Coming later' },
    ],
  },
} as const;

export function getMessages(language: string) {
  return language.toLowerCase().startsWith('zh') ? translations.zh : translations.en;
}
