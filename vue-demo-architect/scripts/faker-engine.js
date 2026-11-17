/**
 * 零依赖轻量级业务仿真随机引擎（可直接复制到目标工程 src/mock/utils/faker.js）
 */
let autoIncId = 1000;

const FIRST_NAMES = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '林'];
const LAST_NAMES = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '艳', '勇', '军', '杰', '娟', '涛', '明', '超', '霞', '平'];
const COMPANIES = ['华东智能科技', '星河云计算', '远航数据服务', '中科工业互联', '启明软件研发', '瑞丰供应链', '博雅数字传媒', '宏图新能源'];
const DEPTS = ['研发中心', '产品规划部', '市场运营部', '客户成功部', '财务审计部', '综合管理部', '数据安全组'];
const SAMPLE_FILES = [
  { name: '2026年度项目立项可行性报告.pdf', ext: 'pdf', size: '2.45 MB', bytes: 2569011 },
  { name: '核心业务系统架构设计图.png', ext: 'png', size: '1.18 MB', bytes: 1237319 },
  { name: '第三季度运营数据汇总明细.xlsx', ext: 'xlsx', size: '856 KB', bytes: 876544 },
  { name: '供应商合规资质审核扫描件.docx', ext: 'docx', size: '1.64 MB', bytes: 1719664 }
];

function int(min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function amount(min = 100, max = 50000) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function pick(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return arr[int(0, arr.length - 1)];
}

function id(prefix = '') {
  autoIncId += 1;
  if (!prefix) return autoIncId;
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `${prefix}${ymd}${String(autoIncId).slice(-4)}`;
}

function cname() {
  return pick(FIRST_NAMES) + pick(LAST_NAMES);
}

function company() {
  return pick(COMPANIES) + '有限公司';
}

function dept() {
  return pick(DEPTS);
}

function phone() {
  const prefixes = ['138', '139', '136', '158', '186', '188', '177'];
  return pick(prefixes) + String(int(10000000, 99999999));
}

function datetime(daysOffset = 0, dateOnly = false) {
  const d = new Date(Date.now() - daysOffset * 86400000 - int(0, 43200) * 1000);
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  if (dateOnly) return `${Y}-${M}-${D}`;
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

function dateLabels(count = 7, type = 'day') {
  const labels = [];
  if (type === 'month') {
    for (let i = 1; i <= count; i++) labels.push(`${i}月`);
    return labels;
  }
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    labels.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return labels;
}

function trendSeries(length = 7, min = 100, max = 1000) {
  const list = [];
  let current = int(min + (max - min) * 0.3, min + (max - min) * 0.7);
  const step = Math.max(1, Math.floor((max - min) * 0.18));
  for (let i = 0; i < length; i++) {
    list.push(current);
    const delta = int(-step, step);
    current = Math.min(max, Math.max(min, current + delta));
  }
  return list;
}

function pieSeries(categories = ['直接访问', '邮件营销', '联盟广告', '视频广告', '搜索引擎'], min = 120, max = 980) {
  return categories.map(name => ({
    name,
    value: int(min, max)
  }));
}

function mockFileMeta(originalName = '') {
  const sample = pick(SAMPLE_FILES);
  const finalName = originalName || sample.name;
  const ext = finalName.includes('.') ? finalName.split('.').pop().toLowerCase() : sample.ext;
  return {
    fileId: id('FILE'),
    fileName: `/profile/upload/demo/${finalName}`,
    newFileName: finalName,
    originalFilename: finalName,
    fileExt: ext,
    size: sample.size,
    fileSize: sample.bytes,
    url: `/demo-static/${encodeURIComponent(finalName)}`,
    uploadTime: datetime(0)
  };
}

export default {
  int,
  amount,
  pick,
  id,
  cname,
  company,
  dept,
  phone,
  datetime,
  dateLabels,
  trendSeries,
  pieSeries,
  mockFileMeta
};
