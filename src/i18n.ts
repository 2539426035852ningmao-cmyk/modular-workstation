export type PageId = 'home' | 'workspace' | 'plugins' | 'settings';

const translations = {
  zh: {
    appName: '模块化工作站', prototype: '技术原型', navigation: '主导航',
    skip: '跳到主内容', context: '当前页面上下文', myStation: '我的工作站', overview: '总览',
    sections: { workspace: '文件与素材', plugins: '插件中心', settings: '外观与基础设置' },
    localSpace: '本地空间', contextNote: '更多功能逐步开放',
    searchUnavailable: '搜索尚未开放', viewWorkspace: '查看工作区', createWorkspace: '新建工作空间', installPlugin: '安装插件',
    workspaceUnavailable: '创建与文件关联尚未开放', pluginUnavailable: '插件安装尚未开放',
    homeNote: '暂无文件与任务',
    themeLabel: '当前主题方式', systemTheme: '跟随系统', themeNote: '手动主题与偏好保存尚未开放',
    pages: {
      home: { label: '首页', title: '从这里开始创作', description: '集中管理空间与工具' },
      workspace: { label: '工作区', title: '工作区', description: '工作空间功能尚未开放' },
      plugins: { label: '插件', title: '插件', description: '插件管理尚未实现' },
      settings: { label: '设置', title: '设置', description: '主题随系统切换' },
    },
    status: '本地使用无需登录', emptyLabel: '等待下一步', explore: '探索工作站',
    modules: [
      { title: '工作区', description: '集中项目与常用工具', status: '尚未创建' },
      { title: '文件与素材', description: '整理文件与创作素材', status: '即将开放' },
      { title: '工具与插件', description: '按需扩展工作站', status: '即将开放' },
    ],
  },
  en: {
    appName: 'Modular Workstation', prototype: 'Technical prototype', navigation: 'Main navigation',
    skip: 'Skip to content', context: 'Page context', myStation: 'My workstation', overview: 'Overview',
    sections: { workspace: 'Files and assets', plugins: 'Plugin center', settings: 'Appearance and basics' },
    localSpace: 'LOCAL SPACE', contextNote: 'More features coming later',
    searchUnavailable: 'Search coming later', viewWorkspace: 'View workspace', createWorkspace: 'New workspace', installPlugin: 'Install plugin',
    workspaceUnavailable: 'Creation and folder linking coming later', pluginUnavailable: 'Plugin installation coming later',
    homeNote: 'No files or tasks yet',
    themeLabel: 'Theme mode', systemTheme: 'Follow system', themeNote: 'Manual themes and saved preferences coming later',
    pages: {
      home: { label: 'Home', title: 'Start creating here', description: 'Keep your work in one place' },
      workspace: { label: 'Workspaces', title: 'Workspaces', description: 'Workspace features coming later' },
      plugins: { label: 'Plugins', title: 'Plugins', description: 'Plugin management is not implemented' },
      settings: { label: 'Settings', title: 'Settings', description: 'Theme follows your system' },
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
