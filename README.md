# dsh-deepseek-balance

在 DSH 桌面端的「设置」里新增一个 **DeepSeek 余额** 页面，实时查询 DeepSeek 开放平台的充值余额。

## 功能

- 填写 DeepSeek API Key（`sk-…`）后，查询并显示：
  - 总余额（total_balance）
  - 赠送余额（granted_balance）
  - 充值余额（topped_up_balance）
  - 账户可用状态（is_available）
- 支持刷新、更换密钥、清除密钥。
- 密钥仅保存在本机 `DSH_HOME/storages/dsh-deepseek-balance/key.txt`，不会上传到任何第三方。

## 数据来源

`GET https://api.deepseek.com/user/balance`（Bearer 鉴权），官方文档：
<https://api-docs.deepseek.com/zh-cn/api/get-user-balance/>

## 结构

| 文件 | 作用 |
| --- | --- |
| `lib/index.js` | 宿主端（Node/Electron）：挂路由、调 DeepSeek 接口、读写密钥 |
| `client/client.js` | 浏览器端：`window.__ModuleLoader__.load` factory，注册 `settings.section` |
| `package.json` | 声明 `exports["./client"]` 与 `dsh.client` |

## 安装（本机部署）

1. 把本包复制到 profile 的 node_modules：

   ```
   C:\Users\<你>\.dsh\profiles\node_modules\dsh-deepseek-balance\
   ```

2. 在 profile 的 `cordis.patch.yml`（`C:\Users\<你>\.dsh\profiles\desktop\cordis.patch.yml`）里加入：

   ```yaml
   - insert:
       - id: dsh-deepseek-balance
         name: 'dsh-deepseek-balance'
   ```

3. 重启 DeepSeek Harness 桌面端，打开「设置 → DeepSeek 余额」。
