# java-checkstyle

**可选 Skill** — Java 代码风格强制规范(Checkstyle + Controller VO + MyBatis-Plus + 质量规范)

## 触发方式

**自动触发:**
- 当检测到生成或修改 `.java` 文件时自动应用

**手动触发:**
```
/java-checkstyle           # 查看 Java 铁律清单
/java-checkstyle check     # 检查当前 Java 代码是否符合规范
```

## 覆盖的铁律

| ID | 铁律 | 说明 |
|----|------|------|
| IL-JAVA001 | NO CODE WITHOUT CHECKSTYLE | 代码风格规范(UTF-8/4空格/125字符/命名规范) |
| IL-JAVA002 | NO CONTROLLER WITHOUT VO | Controller 接口必须用 VO,禁止直接返回 Entity |
| IL-JAVA003 | NO SQL IN JAVA CODE | MyBatis-Plus 强制,禁止硬编码 SQL |
| IL-JAVA004 | NO BAD PRACTICES | 代码质量(禁止魔法值/过度嵌套/万能 try-catch) |

## 使用场景

- Spring Boot 项目代码生成或修改
- Java 代码审查
- 团队代码规范统一

---

**实现:** 读取 `skills/java-checkstyle/SKILL.md` 后执行检查
