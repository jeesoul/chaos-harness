---
name: java-checkstyle
description: Java代码风格强制规范。当生成或修改Java代码时自动应用，包含命名、注释、Controller接口、MyBatis-Plus规范。IL-JAVA001-004强制执行，无例外。
---

<STATE-WRITE-REQUIRED>
**检测到违规时必须写入状态：**
1. 使用 Edit 工具追加到 `~/.claude/harness/iron-law-log.json`
2. 使用 Write 工具追加到 `output/{version}/effectiveness-log.md`

调用 `shared/state-helpers.md` 中的函数：
- Log-Iron-Law-Trigger(ironLawId, context, action)

不写入状态 = 违规未被记录，无法追踪改进
</STATE-WRITE-REQUIRED>

# Java代码风格强制规范

在生成或修改Java代码时，必须严格遵循以下规范。**所有规则都是强制性的，违反将导致代码审查不通过。**

---

## 铁律清单

| ID | 铁律 | 说明 |
|----|------|------|
| IL-JAVA001 | NO CODE WITHOUT CHECKSTYLE | 代码风格规范 |
| IL-JAVA002 | NO CONTROLLER WITHOUT VO | Controller接口规范 |
| IL-JAVA003 | NO SQL IN JAVA CODE | MyBatis-Plus强制规范 |
| IL-JAVA004 | NO BAD PRACTICES | 代码质量规范 |

---

## IL-JAVA001: 代码风格规范

### 基础格式
- UTF-8 字符集
- 每行最大 125 字符
- 4 空格缩进，禁止 Tab
- 注解独占一行
- **必须使用大括号**（包括单行语句）

### 命名规范
- 包名：全小写 `^[a-z]+(\.[a-z][a-z0-9]*)*$`
- 类名/接口名：大驼峰 (PascalCase)
- 变量名：小驼峰 (camelCase)
- 常量名：全大写下划线 (UPPER_SNAKE_CASE)
- 集合变量：复数形式 (users, userList)
- 泛型参数：单大写字母 (T, E, K, V, R)

### 注释规范（强制）

**所有 public 方法必须有完整 Javadoc，无例外！**

```java
/**
 * 类描述
 *
 * @author 作者名
 * @date YYYY-MM-DD
 */
public class ClassName { }

/**
 * 方法描述（有意义内容，禁止泛泛描述）
 *
 * @param paramName 参数说明（每个参数必须说明）
 * @return 返回值说明
 * @throws ExceptionType 异常说明
 */
public ReturnType methodName(ParamType paramName) { }

/**
 * 成员变量说明（禁止行尾注释）
 */
private FieldType fieldName;
```

### 导入规范
- **禁止 `import xxx.*`**
- 导入顺序：java.* → javax.* → 第三方 → 本项目

### 日志规范
- 使用 `@Slf4j`
- **占位符方式**：`log.info("userId: {}", userId)`
- **禁止拼接**：`log.info("userId: " + userId)` ❌

---

## IL-JAVA002: Controller 接口规范

### 请求参数
- 参数 > 3 → 封装实体
- 参数 ≤ 2 → 可用基本类型

### 返回结果（强制）
- **统一响应体**：`R<返回体>`
- **固定实体类**：禁止 `Map`/`JSONObject`/`Object`

### C端接口（app/H5）
- Request: **必须独立 VO** `{业务名}RequestVO`
- Response: **必须独立 VO** `{业务名}ResponseVO`
- 路径前缀：`/app/` 或 `/h5/`

### B端接口（web/admin）
- Request: 尽量独立 VO
- Response: **必须独立 VO**
- 路径前缀：`/web/` 或 `/admin/`

---

## IL-JAVA003: MyBatis-Plus 强制规范

### 默认技术栈
- 新项目用户未指定 → **默认 MyBatis-Plus**
- **禁止代码写 SQL**（@Select/@Update/@Insert 全禁止）

### Mapper XML 强制格式

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.xxx.mapper.XxxMapper">

    <resultMap type="com.xxx.entity.XxxEntity" id="xxxMap">
        <result property="id" column="id"/>
        <result property="fieldName" column="field_name"/>
    </resultMap>

    <sql id="baseColumns">
        id, field_name, create_time, update_time
    </sql>

    <!-- 分页查询：必须在 XML 中 -->
    <select id="pageByEntity" resultType="com.xxx.entity.XxxEntity">
        SELECT <include refid="baseColumns"/>
        FROM table_name
        <where>
            <if test="entity.field != null and entity.field != ''">
                AND field = #{entity.field}
            </if>
        </where>
    </select>

</mapper>
```

### 分页铁律
**NO PAGINATION WITHOUT XML**

```java
// Mapper 接口
public interface XxxMapper extends BaseMapper<XxxEntity> {
    IPage<XxxEntity> pageByEntity(
        @Param("page") IPage<XxxEntity> page,
        @Param("entity") XxxEntity entity
    );
}
```

---

## IL-JAVA004: 代码质量规范

### 禁止项
| 禁止 | 替代 |
|------|------|
| `System.exit()` | 无替代，禁止 |
| `e.printStackTrace()` | `log.error("msg", e)` |
| 字面量比较 `== "xxx"` | `equals()` |
| 返回 null 集合 | 返回空集合 |

### 限制
- 方法参数 ≤ 10
- 方法长度 ≤ 120 行
- 嵌套深度 ≤ 2 层

---

## 生成后强制检查清单

生成/修改 Java 代码后逐项检查：

### 注释检查
- [ ] 类有 Javadoc（@author + @date）
- [ ] **所有 public 方法有完整 Javadoc**（包括 main！）
- [ ] 方法注释有意义描述
- [ ] @param/@return/@throws 完整
- [ ] 成员变量有 Javadoc（禁止行尾注释）

### 导入命名检查
- [ ] 无通配符导入
- [ ] 类名大驼峰，变量小驼峰
- [ ] 常量全大写下划线

### 格式检查
- [ ] 注解独占一行
- [ ] 所有语句块有大括号
- [ ] 4 空格缩进，无 Tab

### 日志异常检查
- [ ] 日志占位符（禁止拼接）
- [ ] 无 e.printStackTrace()

### Controller检查
- [ ] 返回 R<固定VO>
- [ ] 返回体非 Map/JSONObject
- [ ] C端 Request/Response 独立 VO

### MyBatis检查
- [ ] SQL 全在 mapper.xml
- [ ] 分页查询在 XML
- [ ] 无 @Select/@Update/@Insert 注解

---

**⚠️ 特别提醒：main 方法也是 public 方法，必须有 Javadoc！检查时不要遗漏任何一个 public 方法！**