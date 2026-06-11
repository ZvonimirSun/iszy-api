export const BUILT_IN_ROLES = [
  {
    name: 'superadmin',
    alias: '超级管理员',
    desc: '系统内置超级管理员角色',
    isBuiltIn: true,
    isDefault: false,
  },
  {
    name: 'admin',
    alias: '管理员',
    desc: '系统内置管理员角色',
    isBuiltIn: true,
    isDefault: false,
  },
  {
    name: 'user',
    alias: '注册用户',
    desc: '系统内置注册用户角色',
    isBuiltIn: true,
    isDefault: true,
  },
] as const
