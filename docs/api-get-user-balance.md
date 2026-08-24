---
title: DeepSeek 查询余额接口 (Get User Balance)
date: 2026-06-25
tags: [reference, deepseek, api, balance]
source: https://api-docs.deepseek.com/zh-cn/api/get-user-balance/
fetched: 2026-06-25
---

# 查询余额（Get User Balance）

> 来源：[DeepSeek API Docs](https://api-docs.deepseek.com/zh-cn/api/get-user-balance/)

## 端点

```text
GET https://api.deepseek.com/user/balance
```

查询账户余额。

## 认证

请求头携带 API Key：

```text
Authorization: Bearer {YOUR_API_KEY}
Accept: application/json
```

## 响应 200 — OK

返回用户余额详情。

```json
{
  "is_available": true,
  "balance_infos": [
    {
      "currency": "CNY",
      "total_balance": "110.00",
      "granted_balance": "10.00",
      "topped_up_balance": "100.00"
    }
  ]
}
```

## 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `is_available` | boolean | 当前账户是否有余额可供 API 调用 |
| `balance_infos` | object[] | 余额明细数组 |
| `balance_infos[].currency` | string | 货币，可选 `CNY` / `USD` |
| `balance_infos[].total_balance` | string | 总的可用余额，包括赠金和充值余额 |
| `balance_infos[].granted_balance` | string | 未过期的赠金余额 |
| `balance_infos[].topped_up_balance` | string | 充值余额 |

## 备注

- `total_balance = granted_balance + topped_up_balance`
- 本接口被 `dsh-deepseek-balance` 插件调用（见 [`project_14_dsh-deepseek-balance`](../tools/project_14_dsh-deepseek-balance/README.md)）。
