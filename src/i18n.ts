export type PageId = 'home' | 'workspace' | 'plugins' | 'settings';

const translations = {
  zh: {
    appName: '模块化工作站',
    prototype: '技术原型',
    navigation: '主导航',
    pages: {
      home: { label: '概览', title: '从这里，组织你的每一天。', description: '创建一个本地工作区，再按自己的节奏加入文件、工具与插件。' },
      workspace: { label: '工作区', title: '工作区', description: '目前还没有工作区。创建与打开本地工作区将在后续任务中实现。' },
      plugins: { label: '插件', title: '插件', description: '插件管理尚未实现。此原型不会加载第三方代码。' },
      settings: { label: '设置', title: '设置', description: '设置页面尚未实现。主题与语言配置将在后续任务中提供。' },
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
    navigation: 'Main navigation',
    pages: {
      home: { label: 'Overview', title: 'Organize your day from here.', description: 'Start with a local workspace, then add files, tools and plugins at your own pace.' },
      workspace: { label: 'Workspaces', title: 'Workspaces', description: 'No workspace exists yet. Creating and opening local workspaces is planned for a later task.' },
      plugins: { label: 'Plugins', title: 'Plugins', description: 'Plugin management is not implemented. This prototype does not load third-party code.' },
      settings: { label: 'Settings', title: 'Settings', description: 'Settings are not implemented. Theme and language controls are planned for later tasks.' },
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
