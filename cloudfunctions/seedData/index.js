// 云函数：仅插入教室数据（快速，不清数据）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const classroomList = [
  { building: 'A栋', roomNo: 'A101', capacity: 30, reserved: 0 },
  { building: 'A栋', roomNo: 'A102', capacity: 50, reserved: 12 },
  { building: 'A栋', roomNo: 'A201', capacity: 40, reserved: 40 },
  { building: 'A栋', roomNo: 'A202', capacity: 60, reserved: 0 },
  { building: 'A栋', roomNo: 'A301', capacity: 45, reserved: 5 },
  { building: 'B栋', roomNo: 'B101', capacity: 35, reserved: 0 },
  { building: 'B栋', roomNo: 'B102', capacity: 50, reserved: 20 },
  { building: 'B栋', roomNo: 'B201', capacity: 40, reserved: 40 },
  { building: 'B栋', roomNo: 'B202', capacity: 55, reserved: 8 },
  { building: 'B栋', roomNo: 'B301', capacity: 30, reserved: 0 },
  { building: 'C栋', roomNo: 'C101', capacity: 40, reserved: 15 },
  { building: 'C栋', roomNo: 'C102', capacity: 60, reserved: 60 },
  { building: 'C栋', roomNo: 'C201', capacity: 35, reserved: 0 },
  { building: 'C栋', roomNo: 'C202', capacity: 50, reserved: 30 },
  { building: 'D栋', roomNo: 'D101', capacity: 45, reserved: 10 },
  { building: 'D栋', roomNo: 'D102', capacity: 55, reserved: 0 },
  { building: 'D栋', roomNo: 'D201', capacity: 30, reserved: 30 },
  { building: 'D栋', roomNo: 'D202', capacity: 40, reserved: 25 },
  { building: '图书馆', roomNo: '阅览室1', capacity: 80, reserved: 80 },
  { building: '图书馆', roomNo: '阅览室2', capacity: 60, reserved: 18 },
  { building: '图书馆', roomNo: '自习室1', capacity: 40, reserved: 0 },
  { building: '图书馆', roomNo: '自习室2', capacity: 50, reserved: 35 }
]

exports.main = async () => {
  // 先清 classrooms（只有 22 条，快）
  var old = await db.collection('classrooms').limit(100).get()
  await Promise.all(old.data.map(function (r) {
    return db.collection('classrooms').doc(r._id).remove()
  }))

  // 并行插入 22 条教室
  var tasks = classroomList.map(function (item) {
    return db.collection('classrooms').add({ data: item })
  })
  await Promise.all(tasks)

  return { success: classroomList.length }
}
