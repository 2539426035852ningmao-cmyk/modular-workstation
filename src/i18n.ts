export type PageId = 'home' | 'workspace' | 'plugins' | 'settings';

const translations = {
  zh: {
    appName: '模块化工作站',
    prototype: '技术原型',
    skip: '跳到主内容', context: '当前页面上下文', myStation: '我的工作站', overview: '总览',
    sections: { workspace: '文件与素材', plugins: '插件中心', settings: '外观与基础设置' },
    localSpace: '本地空间', contextNote: '基础导航已可使用。工作空间、文件与插件功能将按计划逐步提供。',
    searchUnavailable: '搜索尚未开放', viewWorkspace: '查看工作区', createWorkspace: '新建工作空间', installPlugin: '安装插件',
    workspaceUnavailable: '创建、关联文件夹与素材管理尚未实现。', pluginUnavailable: '安装与权限管理尚未实现，不会加载第三方代码。',
    homeNote: '尚无文件或任务记录。这里仅提供已可用的页面导航，不展示示例业务数据。',
    themeLabel: '当前主题方式', systemTheme: '跟随系统', themeNote: '深浅主题随系统切换；手动选择与偏好保存尚未实现。', previewOnly: '桌面 Shell · 功能逐步开放',
    navigation: '主导航',
    pages: {
      home: { label: '首页', title: '从这里，组织你的每一天。', description: '创建一个本地工作区，再按自己的节奏加入文件、工具与插件。' },
      workspace: { label: '工作区', title: '工作区', description: '目前还没有工作区。创建与打开本地工作区将在后续任务中实现。' },
      plugins: { label: '插件', title: '插件', description: '插件管理尚未实现。此原型不会加载第三方代码。' },
      settings: { label: '设置', title: '设置', description: '主题已跟随系统。手动主题、语言与其他配置将在后续任务中提供。' },
    },
    status: '本地原型 · 无需登录',
    emptyLabel: '等待下一步',
    firstStep: '第一步 · 建立空间',
    welcomeTitle: '让想法有一个落脚点',
    welcomeDescription: '工作区会成为项目、素材和工具的起点。创建本地工作区的功能正在开发中。',
    explore: '探索工作站',
    modules: [
      { symbol: '▣', title: '工作区', description: '为不同项目建立专属空间，集中常用视图与工具。', status: '尚未创建' },
      { symbol: '▤', title: '文件与素材', description: '连接本地文件夹，清晰管理创作过程中的内容。', status: '即将开放' },
      { symbol: '⬡', title: '工具与插件', description: '只启用真正需要的能力，保持工作台轻盈。', status: '即将开放' },
    ],
  },
  en: {
    appName: 'Modular Workstation',
    prototype: 'Technical prototype',
    skip: 'Skip to content', context: 'Page context', myStation: 'My workstation', overview: 'Overview',
    sections: { workspace: 'Files & assets', plugins: 'Plugin center', settings: 'Appearance & basics' },
    localSpace: 'LOCAL SPACE', contextNote: 'Page navigation is available. Workspaces, files and plugins will follow in later tasks.',
    searchUnavailable: 'Search coming later', viewWorkspace: 'View workspace', createWorkspace: 'New workspace', installPlugin: 'Install plugin',
    workspaceUnavailable: 'Workspace creation, folder linking and asset management are not implemented.', pluginUnavailable: 'Installation and permissions are not implemented. No third-party code is loaded.',
    homeNote: 'There are no file or task records. These entries navigate to existing pages; no sample business data is shown.',
    themeLabel: 'Theme mode', systemTheme: 'Follow system', themeNote: 'Light and dark themes follow the system. Manual selection and preference storage are not implemented.', previewOnly: 'Desktop shell · More to come',
    navigation: 'Main navigation',
    pages: {
      home: { label: 'Home', title: 'Organize your day from here.', description: 'Start with a local workspace, then add files, tools and plugins at your own pace.' },
      workspace: { label: 'Workspaces', title: 'Workspaces', description: 'No workspace exists yet. Creating and opening local workspaces is planned for a later task.' },
      plugins: { label: 'Plugins', title: 'Plugins', description: 'Plugin management is not implemented. This prototype does not load third-party code.' },
      settings: { label: 'Settings', title: 'Settings', description: 'The theme follows your system. Manual theme, language and other preferences are planned for later tasks.' },
    },
    status: 'Local prototype · No sign-in',
    emptyLabel: 'Coming later',
    firstStep: 'FIRST STEP · MAKE SPACE',
    welcomeTitle: 'Give ideas a place to land',
    welcomeDescription: 'A workspace will be the starting point for projects, assets and tools. Local workspace creation is in development.',
    explore: 'Explore the workstation',
    modules: [
      { symbol: '▣', title: 'Workspaces', description: 'Create dedicated spaces for projects, views and tools.', status: 'Not created' },
      { symbol: '▤', title: 'Files & assets', description: 'Connect local folders and organize creative work.', status: 'Coming later' },
      { symbol: '⬡', title: 'Tools & plugins', description: 'Enable only the abilities you need.', status: 'Coming later' },
    ],
  },
} as const;

export function getMessages(language: string) {
  return language.toLowerCase().startsWith('zh') ? translations.zh : translations.en;
}
