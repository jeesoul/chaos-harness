# Chaos Harness Shared Helpers

> 所有 skill 共用的操作指南，引用而非复制。

---

## 铁律检查

1. 读取 `templates/iron-laws.yaml` 获取当前项目铁律
2. 根据操作匹配触发条件
3. 返回 pass / fail / warn

## 版本锁定检查

```bash
# 检查版本锁定状态
if [ -f "output/<version>/VERSION-LOCK" ]; then
  # 读取锁定版本，比较请求版本
  locked_version=$(cat "output/<version>/VERSION-LOCK")
  if [ "$locked_version" != "$requested_version" ]; then
    echo "版本已锁定为 $locked_version"
    exit 1
  fi
fi
```

## 扫描结果管理

```bash
# 创建扫描结果
# 输出路径: .chaos-harness/scan-result.json
create_scan_result() {
  # 使用 project-scanner skill 的检测结果
  # 或直接运行: /chaos-harness:project-scanner
}

# 验证扫描结果
validate_scan_result() {
  [ -f .chaos-harness/scan-result.json ] || return 1
  jq -e '.projectType and .scanTime' .chaos-harness/scan-result.json >/dev/null 2>&1
}
```

## 偷懒检测

6 种模式：
- LP001: 声称完成但无验证证据
- LP002: 跳过根因分析直接修复
- LP003: 长时间无产出 (timeout)
- LP004: 试图跳过测试
- LP005: 擅自更改版本号
- LP006: 自动处理高风险配置

检测后记录：参见 state-helpers.md#log_laziness

## 文档操作

- 文档必须输出到 `output/<version>/` 目录（IL001）
- 阶段文档路径：`output/<version>/docs/W<NN>-<stage-name>.md`
- 验证产出：检查文件存在且非空

## Token 优化

- 引用模式：不要嵌入完整指令，引用 `state-helpers.md#函数名`
- 懒加载：仅在需要时加载详细内容

---

详细的状态写入函数参见 [state-helpers.md](state-helpers.md)
