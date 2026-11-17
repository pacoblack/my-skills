// 零依赖原生随机数据引擎（支持跨页面共享实体关联、ECharts 图表与轻量附件元数据）

const SURNAMES = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗']
const GIVEN_NAMES = ['伟', '芳', '娜', '敏', '静', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平', '刚']
const COMPANIES = [
  '华东云计算中心', '星辰智能科技有限公司', '远航数字能源集团', '中科智慧城市研究院',
  '海纳现代物流有限公司', '瑞丰精密制造股份有限公司', '天枢大数据运营中心', '启明信息系统集成部'
]
const DEPARTMENTS = ['研发一部', '产品设计部', '项目交付中心', '市场运营部', '质量保障部', '财务管理部', '综合行政部']
const SAMPLE_FILES = [
  { name: '2026年度项目立项可行性报告.pdf', size: '2.45 MB', ext: 'pdf' },
  { name: '系统架构设计与接口规范说明.docx', size: '1.18 MB', ext: 'docx' },
  { name: '季度业务运营数据汇总台账.xlsx', size: '856 KB', ext: 'xlsx' },
  { name: '现场勘察与验收影像记录_01.jpg', size: '3.62 MB', ext: 'jpg' },
  { name: '安全合规审查确认单扫描件.png', size: '1.04 MB', ext: 'png' }
]

let autoInc = 1000
const entityRegistry = {}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return ''
  return arr[randInt(0, arr.length - 1)]
}

function registerEntities(type, list) {
  if (Array.isArray(list) && list.length > 0) {
    entityRegistry[type] = list
  }
}

function getEntities(type) {
  return entityRegistry[type] || []
}

function pickEntity(type) {
  const list = entityRegistry[type]
  if (!Array.isArray(list) || list.length === 0) return null
  return pick(list)
}

function id(prefix = '') {
  autoInc += 1
  if (!prefix) return autoInc
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `${prefix}${ymd}${String(autoInc).slice(-4)}`
}

function cname() {
  return pick(SURNAMES) + pick(GIVEN_NAMES)
}

function company() {
  return pick(COMPANIES)
}

function department() {
  return pick(DEPARTMENTS)
}

function phone() {
  const prefixes = ['138', '139', '186', '188', '135', '158', '177']
  let num = pick(prefixes)
  for (let i = 0; i < 8; i++) {
    num += randInt(0, 9)
  }
  return num
}

function datetime(daysOffset = 0, dateOnly = false) {
  const d = new Date(Date.now() + daysOffset * 86400 * 1000 - randInt(0, 3600 * 12) * 1000)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  if (dateOnly) return `${yyyy}-${mm}-${dd}`
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

function amount(min = 100, max = 50000) {
  return Number((Math.random() * (max - min) + min).toFixed(2))
}

function dateLabels(count = 7, type = 'day') {
  if (type === 'month') {
    return Array.from({ length: count }, (_, i) => `${(i % 12) + 1}月`)
  }
  const labels = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400 * 1000)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    labels.push(`${mm}-${dd}`)
  }
  return labels
}

function trendSeries(length = 7, min = 50, max = 200) {
  const result = []
  let current = randInt(min, Math.floor((min + max) / 2))
  const step = Math.max(1, Math.floor((max - min) / 5))
  for (let i = 0; i < length; i++) {
    const delta = randInt(-step, Math.floor(step * 1.3))
    current = Math.min(max, Math.max(min, current + delta))
    result.push(current)
  }
  return result
}

function pieSeries(categories = ['类型A', '类型B', '类型C'], min = 20, max = 150) {
  return categories.map(name => ({
    name,
    value: randInt(min, max)
  }))
}

function mockFileMeta(originalName = '') {
  const sample = pick(SAMPLE_FILES)
  const fileName = originalName || sample.name
  const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/)
  const ext = extMatch ? extMatch[1].toLowerCase() : sample.ext
  return {
    fileId: id('FILE'),
    fileName,
    originalFilename: fileName,
    size: sample.size,
    ext,
    url: `/demo-static/files/${encodeURIComponent(fileName)}`,
    uploadTime: datetime(0)
  }
}

export default {
  randInt,
  pick,
  registerEntities,
  getEntities,
  pickEntity,
  id,
  cname,
  company,
  department,
  phone,
  datetime,
  amount,
  dateLabels,
  trendSeries,
  pieSeries,
  mockFileMeta
}
