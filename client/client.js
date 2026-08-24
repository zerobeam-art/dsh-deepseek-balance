// dsh-deepseek-balance 浏览器端 bundle。
// 惰性 CJS factory 格式：脚本加载时只注册 factory，物化时执行正文并返回
// 模块导出表层 { name, inject, apply }。
window.__ModuleLoader__.load({ id: "dsh-deepseek-balance", factory: (require) => {
  var module = { exports: {} };
  var exports = module.exports;

  var react = require("react");
  var h = react.createElement;
  var useState = react.useState;
  var useEffect = react.useEffect;
  var useCallback = react.useCallback;

  var name = "dsh-deepseek-balance";
  var inject = ["slots", "locale"];
  var NS = "dsh-deepseek-balance";

  var zh = {
    nav: "DeepSeek 余额",
    title: "DeepSeek 开放平台余额",
    desc: "查询你的 DeepSeek API 账户充值余额。",
    notConfigured: "尚未配置 API 密钥",
    keyLabel: "API 密钥",
    keyPlaceholder: "粘贴你的 DeepSeek API Key（sk-…）",
    keyHint: "密钥仅保存在本机（DSH_HOME/storages），不会上传到任何第三方。",
    save: "保存并查询",
    saving: "保存中…",
    refresh: "刷新",
    changeKey: "更换密钥",
    clearKey: "清除密钥",
    clearConfirm: "确定清除已保存的密钥？",
    total: "总余额",
    granted: "赠送余额",
    toppedUp: "充值余额",
    available: "可用",
    unavailable: "不可用",
    loading: "查询中…",
    loadError: "查询失败",
    keySavedError: "保存失败",
    currency: "币种",
  };

  var en = {
    nav: "DeepSeek Balance",
    title: "DeepSeek API Balance",
    desc: "Check your DeepSeek API account balance.",
    notConfigured: "No API key configured",
    keyLabel: "API Key",
    keyPlaceholder: "Paste your DeepSeek API key (sk-…)",
    keyHint: "The key is stored only on this machine (DSH_HOME/storages) and never leaves it.",
    save: "Save & query",
    saving: "Saving…",
    refresh: "Refresh",
    changeKey: "Change key",
    clearKey: "Clear key",
    clearConfirm: "Clear the saved API key?",
    total: "Total balance",
    granted: "Granted balance",
    toppedUp: "Topped-up balance",
    available: "Available",
    unavailable: "Unavailable",
    loading: "Loading…",
    loadError: "Query failed",
    keySavedError: "Save failed",
    currency: "Currency",
  };

  function apply(ctx) {
    ctx.effect(function () {
      ctx.locale.register(NS, { zh: zh, en: en });
    }, "dsh-deepseek-balance: dictionaries");
    var t = ctx.locale.bind(NS);

    ctx.slots.inject("settings.section", function () {
      return ctx.slots.register({
        name: "settings.section",
        id: "deepseek-balance",
        order: 41,
        label: function () { return t("nav"); },
        locale: NS,
        inject: function () { return { t: t }; },
      }, function () { return h(BalanceSection, { t: t }); });
    });
  }

  // ---- 轻量内联样式（带主题变量回退）----
  function css(extra) {
    return extra;
  }

  var boxStyle = css({
    display: "flex", flexDirection: "column", gap: "16px",
    padding: "20px", maxWidth: "560px",
  });
  var cardStyle = css({
    background: "var(--dsw-alias-bg-layer-1, #ffffff)",
    border: "1px solid var(--dsw-alias-border, rgba(0,0,0,0.12))",
    borderRadius: "12px", padding: "16px",
  });
  var rowStyle = css({
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 0",
  });
  var labelStyle = css({ color: "var(--dsw-alias-label-secondary, #6b7280)", fontSize: "13px" });
  var valueStyle = css({ color: "var(--dsw-alias-label-primary, #1f2328)", fontSize: "15px", fontWeight: 600 });
  var hintStyle = css({ color: "var(--dsw-alias-label-secondary, #6b7280)", fontSize: "12px", lineHeight: 1.5 });
  var errorStyle = css({ color: "var(--dsw-alias-danger, #dc2626)", fontSize: "13px" });
  var buttonStyle = css({
    background: "var(--dsw-alias-brand-primary, #4f6ef7)", color: "#ffffff",
    border: "none", borderRadius: "8px", padding: "8px 14px",
    fontSize: "13px", cursor: "pointer",
  });
  var ghostButtonStyle = css({
    background: "transparent",
    color: "var(--dsw-alias-label-primary, #1f2328)",
    border: "1px solid var(--dsw-alias-border, rgba(0,0,0,0.18))",
    borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer",
  });
  var inputStyle = css({
    width: "100%", boxSizing: "border-box",
    background: "var(--dsw-alias-bg-layer-2, #f3f4f6)",
    color: "var(--dsw-alias-label-primary, #1f2328)",
    border: "1px solid var(--dsw-alias-border, rgba(0,0,0,0.18))",
    borderRadius: "8px", padding: "8px 10px", fontSize: "13px",
    outline: "none",
  });

  function BalanceSection(props) {
    var t = props.t;
    var configured = useConfigured();
    var balance = useBalance(configured);
    var [draft, setDraft] = useState("");
    var [busy, setBusy] = useState(false);
    var [msg, setMsg] = useState(null); // {kind:'error'|'ok', text}
    var [editing, setEditing] = useState(false);

    var loadBalance = balance.load;

    var saveKey = useCallback(function () {
      if (draft.trim() === "") { setMsg({ kind: "error", text: t("keyPlaceholder") }); return; }
      setBusy(true);
      setMsg(null);
      fetch("/dsh-deepseek-balance/key", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: draft.trim() }),
      })
        .then(function (r) { return r.json(); })
        .then(function (body) {
          setBusy(false);
          if (body && body.ok) {
            setDraft("");
            setEditing(false);
            setMsg({ kind: "ok", text: t("save") });
            configured.reload();
            loadBalance();
          } else {
            setMsg({ kind: "error", text: (body && body.error) || t("keySavedError") });
          }
        })
        .catch(function (e) {
          setBusy(false);
          setMsg({ kind: "error", text: String(e && e.message || t("keySavedError")) });
        });
    }, [draft, t, configured, loadBalance]);

    var clearKey = useCallback(function () {
      if (!window.confirm(t("clearConfirm"))) return;
      setMsg(null);
      fetch("/dsh-deepseek-balance/clear", { method: "POST" })
        .then(function (r) { return r.json(); })
        .then(function () {
          setDraft("");
          setEditing(false);
          configured.reload();
          balance.reset();
        })
        .catch(function () {});
    }, [t, configured, balance]);

    var isNotConfigured = configured.value !== null && configured.value === false;

    return h("div", { style: boxStyle },
      h("div", null,
        h("div", { style: { fontSize: "15px", fontWeight: 700, color: "var(--dsw-alias-label-primary, #1f2328)", marginBottom: "6px" } }, t("title")),
        h("div", { style: hintStyle }, t("desc")),
      ),

      // 密钥区
      isNotConfigured || editing ? h("div", { style: cardStyle },
        h("div", { style: { marginBottom: "8px", fontSize: "13px", color: "var(--dsw-alias-label-primary, #1f2328)" } }, t("keyLabel")),
        h("input", {
          type: "password",
          style: inputStyle,
          placeholder: t("keyPlaceholder"),
          value: draft,
          onChange: function (e) { setDraft(e.target.value); },
        }),
        h("div", { style: { ...hintStyle, marginTop: "6px" } }, t("keyHint")),
        h("div", { style: { display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" } },
          h("button", { style: buttonStyle, disabled: busy, onClick: saveKey }, busy ? t("saving") : t("save")),
          isNotConfigured ? null : h("button", { style: ghostButtonStyle, onClick: function () { setEditing(false); setDraft(""); } }, "✕"),
        ),
        msg && msg.kind === "error" ? h("div", { style: { ...errorStyle, marginTop: "8px" } }, msg.text) : null,
      ) : null,

      // 余额区
      h("div", { style: cardStyle },
        configured.value === null ? h("div", { style: hintStyle }, t("loading"))
          : balance.value && balance.value.ok ? h("div", null,
              balance.value.balance_infos && balance.value.balance_infos.map(function (info) {
                return h("div", { key: info.currency || "cn", style: { display: "flex", flexDirection: "column", gap: "4px" } },
                  h("div", { style: { display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" } },
                    h("span", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary, #6b7280)" } }, t("currency") + ": " + (info.currency || "")),
                    h("span", {
                      style: {
                        fontSize: "12px", padding: "2px 8px", borderRadius: "999px",
                        color: balance.value.is_available ? "var(--dsw-alias-success, #16a34a)" : "var(--dsw-alias-danger, #dc2626)",
                        background: "var(--dsw-alias-bg-layer-2, #f3f4f6)",
                      },
                    }, balance.value.is_available ? t("available") : t("unavailable")),
                  ),
                  h("div", { style: rowStyle }, h("span", { style: labelStyle }, t("total")), h("span", { style: valueStyle }, info.total_balance)),
                  h("div", { style: rowStyle }, h("span", { style: labelStyle }, t("granted")), h("span", { style: valueStyle }, info.granted_balance)),
                  h("div", { style: rowStyle }, h("span", { style: labelStyle }, t("toppedUp")), h("span", { style: valueStyle }, info.topped_up_balance)),
                );
              })
            )
          : balance.value && balance.value.error === "not-configured" ? h("div", { style: hintStyle }, t("notConfigured"))
          : balance.error ? h("div", { style: errorStyle }, t("loadError") + ": " + balance.error)
          : h("div", { style: hintStyle }, t("loading")),
        h("div", { style: { display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" } },
          h("button", { style: ghostButtonStyle, onClick: loadBalance }, t("refresh")),
          configured.value ? h("button", { style: ghostButtonStyle, onClick: function () { setEditing(true); setMsg(null); } }, t("changeKey")) : null,
          configured.value ? h("button", { style: ghostButtonStyle, onClick: clearKey }, t("clearKey")) : null,
        ),
      ),
    );
  }

  // 是否已配置密钥
  function useConfigured() {
    var [value, setValue] = useState(null);
    var reload = useCallback(function () {
      fetch("/dsh-deepseek-balance/status", { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (b) { setValue(!!(b && b.configured)); })
        .catch(function () { setValue(null); });
    }, []);
    useEffect(function () { reload(); }, [reload]);
    return { value: value, reload: reload };
  }

  // 余额数据
  function useBalance(configured) {
    var [value, setValue] = useState(null);
    var [error, setError] = useState(null);

    var load = useCallback(function () {
      setError(null);
      fetch("/dsh-deepseek-balance/balance", { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (b) { setValue(b || null); })
        .catch(function (e) { setError(String(e && e.message || "error")); });
    }, []);

    var reset = useCallback(function () { setValue(null); setError(null); }, []);

    useEffect(function () {
      if (configured.value === true) load();
      else { setValue(null); setError(null); }
    }, [configured.value, load]);

    return { value: value, error: error, load: load, reset: reset };
  }

  exports.name = name;
  exports.inject = inject;
  exports.apply = apply;
  return module.exports;
}});
