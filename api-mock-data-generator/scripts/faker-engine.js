// 零依赖确定性高仿真业务数据引擎（全行业可扩展模板版）

// =========================================================================
// 【可自定义扩充区】遇到新行业或特定业务关键词时，直接在此处添加词库即可
// =========================================================================
export const CUSTOM_DICTIONARIES = {
  // 1. 通用人物与组织
  person: ['张伟', '李娜', '王强', '陈敏', '刘洋', '赵磊', '周静', '吴勇', '黄杰', '徐娟'],
  dept: ['数字化转型部', '研发中心', '华东交付部', '市场运营部', '财务审计部', '综合管理办公室'],
  company: ['华东智慧建设集团', '星海云计算科技公司', '中科数字能源研究院', '天枢智能制造基地', '海川供应链中心'],
  
  // 2. 多行业业务标杆名称库（按关键词自动匹配）
  project: ['智慧园区一期综合管控平台', '数据中台安全升级改造', '城市大脑应急指挥系统', '新能源微电网监测项目'],
  device: ['高精度温湿度传感器-A1', '边缘计算网关-Edge200', '智能电表三相导轨式', '工业视觉质检相机'],
  order: ['2026年度集采框架采购单', '华东区服务器扩容订单', '核心备件紧急调拨单', '年度维保服务续签单'],
  contract: ['数字化底座建设技术开发合同', '云资源年度租赁框架协议', '智能化硬件设备采购合同'],
  customer: ['中国移动华东分公司', '国家电网省电力公司', '某市大数据管理局', '中建八局第一建设公司'],
  course: ['人工智能与大模型实战', '企业级微服务架构设计', '数据安全与合规治理', '敏捷项目管理进阶'],
  patient: ['门诊常规复查记录', '心内科住院评估档案', '健康体检中心年度报告'],
  
  // 3. 通用状态与标签
  address: ['上海市浦东新区张江高科技园区科苑路88号', '北京市海淀区中关村软件园二期', '杭州市滨江区网商路699号', '深圳市南山区科技园南区'],
  remark: ['按计划节点正常推进中', '已通过内部技术评审，待最终确认', '重点保障项目，需每周同步进展', '已完成阶段性交付验收']
};

// 固定演示主线主角用户
export const DEMO_USER = {
  userId: 'USR-2026-001',
  userName: '张伟',
  roleName: '系统管理员 / 项目总监',
  deptName: '数字化交付中心',
  phone: '13800138001'
};

// 确定性伪随机生成器（Mulberry32）
let _seed = 20260318;
function seededRandom() {
  let t = (_seed += 0x6D2B79F5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const BASE_TIME = 1773799200000;
let seq = 1000;

export const faker = {
  resetSeed(seed = 20260318) {
    _seed = seed;
    seq = 1000;
  },
  id(prefix = 'ID') {
    seq += 1;
    return `${prefix}2026${seq}`;
  },
  pick(arr = []) {
    if (!arr || !arr.length) return '';
    return arr[Math.floor(seededRandom() * arr.length)];
  },
  cname() { return this.pick(CUSTOM_DICTIONARIES.person); },
  company() { return this.pick(CUSTOM_DICTIONARIES.company); },
  dept() { return this.pick(CUSTOM_DICTIONARIES.dept); },
  address() { return this.pick(CUSTOM_DICTIONARIES.address); },
  phone() {
    const p = this.pick(['138', '139', '186', '158', '177']);
    return p + String(Math.floor(10000000 + seededRandom() * 90000000));
  },
  email() {
    return `user${this.int(100, 999)}@enterprise-demo.com`;
  },
  datetime(daysOffset = 0) {
    const d = new Date(BASE_TIME - daysOffset * 86400000 - Math.floor(seededRandom() * 36000000));
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  },
  date(daysOffset = 0) {
    return this.datetime(daysOffset).split(' ');
  },
  amount(min = 1000, max = 50000) {
    return Number((min + seededRandom() * (max - min)).toFixed(2));
  },
  int(min = 1, max = 500) {
    return Math.floor(min + seededRandom() * (max - min + 1));
  },
  /**
   * 【泛化核心】根据字段英文名(name)或中文标签(label)自动推导最贴切的仿真值
   */
  smartValue(fieldName = '', fieldLabel = '', enumValues = []) {
    // 1. 优先命中枚举值
    if (Array.isArray(enumValues) && enumValues.length > 0) {
      return this.pick(enumValues);
    }
    const key = `${fieldName} ${fieldLabel}`.toLowerCase();

    // 2. 匹配自定义业务词库（自动遍历 CUSTOM_DICTIONARIES 的所有键名）
    for (const dictKey of Object.keys(CUSTOM_DICTIONARIES)) {
      if (key.includes(dictKey.toLowerCase())) {
        return this.pick(CUSTOM_DICTIONARIES[dictKey]);
      }
    }

    // 3. 常见语义规则兜底
    if (/id$|code$|no$|number$/i.test(fieldName)) return this.id('NO');
    if (/phone|mobile|tel|电话|手机/.test(key)) return this.phone();
    if (/email|mail|邮箱/.test(key)) return this.email();
    if (/user|creator|author|manager|owner|person|姓名|负责人|创建人|审批人/.test(key)) return this.cname();
    if (/dept|org|部门|机构|组织/.test(key)) return this.dept();
    if (/company|enterprise|vendor|supplier|公司|企业|供应商|单位/.test(key)) return this.company();
    if (/addr|location|city|地址|位置|城市/.test(key)) return this.address();
    if (/time|date|created|updated|时间|日期/.test(key)) return this.datetime(this.int(0, 30));
    if (/price|amount|money|cost|fee|budget|金额|预算|费用|单价/.test(key)) return this.amount(100, 10000);
    if (/count|num|qty|total|age|sort|数量|总数|年龄|排序/.test(key)) return this.int(1, 200);
    if (/rate|percent|ratio|比例|率|进度/.test(key)) return this.int(10, 100);
    if (/status|state|type|category|状态|类型|分类/.test(key)) return this.pick(['0', '1', '2']);
    if (/remark|desc|note|content|reason|备注|描述|说明|原因/.test(key)) return this.pick(CUSTOM_DICTIONARIES.remark);
    if (/title|name|subject|名称|标题/.test(key)) return `${this.pick(['标准', '核心', '重点', '专项'])}业务数据项-${this.int(10, 99)}`;

    // 4. 终极兜底（防止出现未知字段返回空）
    return `${fieldLabel || fieldName || '示例数据'}_${this.int(10, 99)}`;
  },
  dateLabels(count = 7) {
    const list = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(BASE_TIME - i * 86400000);
      list.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return list;
  },
  trendSeries(length = 7, min = 40, max = 180) {
    let cur = Math.floor((min + max) / 2);
    return Array.from({ length }, () => {
      const step = Math.floor((seededRandom() - 0.45) * ((max - min) * 0.25));
      cur = Math.max(min, Math.min(max, cur + step));
      return cur;
    });
  },
  pieSeries(categories = ['进行中', '已完成', '待审核', '已暂停']) {
    return categories.map(name => ({ name, value: this.int(20, 200) }));
  },
  mockFileMeta(originalName) {
    const samples = ['2026年度业务立项报告.pdf', '系统架构设计说明书.docx', '采购清单明细表.xlsx', '现场勘察验收照片.jpg'];
    const fileName = originalName || this.pick(samples);
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'pdf';
    return {
      fileId: this.id('FILE'),
      fileName,
      originalFilename: fileName,
      fileSize: `${(0.5 + seededRandom() * 8.5).toFixed(2)} MB`,
      fileExt: ext,
      url: `/mock-files/${encodeURIComponent(fileName)}`,
      uploadTime: this.datetime(0)
    };
  },
  createCrudStore(anchors = [], fillCount = 10, rowFactory = () => ({}), idKeys = ['id']) {
    const list = [
      ...anchors.map(item => ({ ...item })),
      ...Array.from({ length: fillCount }, (_, idx) => rowFactory(idx + anchors.length))
    ];
    const matchRow = (row, targetId) => idKeys.some(k => row[k] !== undefined && String(row[k]) === String(targetId));

    return {
      list,
      query({ pageNum = 1, pageSize = 10, keyword = '', filterFn } = {}) {
        let filtered = list;
        if (typeof filterFn === 'function') {
          filtered = filtered.filter(filterFn);
        } else if (keyword) {
          filtered = filtered.filter(item => JSON.stringify(item).includes(String(keyword)));
        }
        const start = (Number(pageNum) - 1) * Number(pageSize);
        return {
          records: filtered.slice(start, start + Number(pageSize)).map(r => ({ ...r })),
          total: filtered.length
        };
      },
      detail(targetId) {
        const found = targetId !== undefined && targetId !== ''
          ? list.find(r => matchRow(r, targetId))
          : null;
        return { ...(found || list || {}) };
      },
      create(payload = {}) {
        const newId = this.id('NEW');
        const newRow = { id: newId, ...rowFactory(list.length), ...payload };
        list.unshift(newRow);
        return { ...newRow };
      },
      update(payload = {}, targetId) {
        const keyVal = targetId ?? idKeys.map(k => payload[k]).find(v => v !== undefined);
        const idx = list.findIndex(r => matchRow(r, keyVal));
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...payload };
          return { ...list[idx] };
        }
        return null;
      },
      remove(targetId) {
        const ids = Array.isArray(targetId) ? targetId.map(String) : [String(targetId)];
        for (let i = list.length - 1; i >= 0; i--) {
          if (idKeys.some(k => list[i][k] !== undefined && ids.includes(String(list[i][k])))) {
            list.splice(i, 1);
          }
        }
      }
    };
  }
};
