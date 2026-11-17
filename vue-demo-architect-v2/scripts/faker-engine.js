// 零依赖原生 JS 随机与全局实体关联引擎
const SURNAMES = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴'];
const NAMES = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '艳', '勇'];
const COMPANIES = ['华东云计算中心', '智慧城市运营部', '数字能源研究院', '北方智能制造基地', '数科创新中心'];

let autoIncId = 1000;
const entityStore = {
  projects: [
    { id: 'PRJ-2026-001', projectCode: 'PRJ-001', projectName: '智慧园区综合管理平台（一期）', manager: '张伟', dept: '数字能源研究院', budget: 480000 },
    { id: 'PRJ-2026-002', projectCode: 'PRJ-002', projectName: '华东数据中心算力扩容项目', manager: '李娜', dept: '华东云计算中心', budget: 920000 },
    { id: 'PRJ-2026-003', projectCode: 'PRJ-003', projectName: '城市交通数字孪生底座建设', manager: '王强', dept: '智慧城市运营部', budget: 650000 }
  ],
  customers: [
    { id: 'CUS-001', customerName: '中科智联科技有限公司', contact: '陈敏', phone: '13800138001' },
    { id: 'CUS-002', customerName: '海川能源集团股份公司', contact: '周洋', phone: '13900139002' }
  ]
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[randInt(0, arr.length - 1)];
}

export const faker = {
  registerEntities(customEntities = {}) {
    Object.keys(customEntities).forEach((key) => {
      if (Array.isArray(customEntities[key]) && customEntities[key].length > 0) {
        entityStore[key] = customEntities[key];
      }
    });
  },
  getEntities(type) {
    return entityStore[type] || [];
  },
  pickEntity(type, index) {
    const list = entityStore[type] || [];
    if (list.length === 0) return {};
    if (typeof index === 'number') return list[index % list.length];
    return pick(list);
  },
  id(prefix = '') {
    autoIncId += 1;
    return prefix ? `${prefix}${autoIncId}` : autoIncId;
  },
  cname() {
    return pick(SURNAMES) + pick(NAMES);
  },
  company() {
    return pick(COMPANIES);
  },
  phone() {
    return `13${randInt(5, 9)}${String(randInt(10000000, 99999999))}`;
  },
  datetime(daysAgo = 0) {
    const d = new Date(Date.now() - daysAgo * 86400000 - randInt(0, 36000000));
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  },
  date(daysAgo = 0) {
    return this.datetime(daysAgo).slice(0, 10);
  },
  amount(min = 1000, max = 50000) {
    return Number((Math.random() * (max - min) + min).toFixed(2));
  },
  pick,
  randInt,
  dateLabels(count = 7) {
    const labels = [];
    for (let i = count - 1; i >= 0; i--) {
      labels.push(this.date(i).slice(5));
    }
    return labels;
  },
  trendSeries(length = 7, min = 40, max = 200) {
    const arr = [];
    let current = randInt(min, max);
    for (let i = 0; i < length; i++) {
      const step = Math.floor((max - min) * 0.15);
      current = Math.max(min, Math.min(max, current + randInt(-step, step)));
      arr.push(current);
    }
    return arr;
  },
  pieSeries(categories = ['进行中', '已完成', '待审核'], min = 15, max = 120) {
    return categories.map((name) => ({ name, value: randInt(min, max) }));
  },
  mockFileMeta(originalName) {
    const name = originalName || `业务附件_${randInt(100, 999)}.pdf`;
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : 'pdf';
    return {
      fileId: this.id('FILE-'),
      fileName: name,
      originalFilename: name,
      fileSize: `${(Math.random() * 4.5 + 0.2).toFixed(2)} MB`,
      fileExt: ext,
      url: `/demo-static/files/${encodeURIComponent(name)}`,
      uploadTime: this.datetime(0)
    };
  }
};
