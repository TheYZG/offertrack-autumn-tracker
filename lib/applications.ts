export const stageOptions = [
  '待补充',
  '已投递',
  '简历筛选',
  '测评',
  '笔试',
  '面试',
  'Offer',
  '已结束',
] as const;

export type CurrentStage = (typeof stageOptions)[number];

export interface ApplicationRecord {
  id: string;
  company: string;
  portalUrl: string;
  stage: CurrentStage;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

const rawApplications: Array<[string, string, string?]> = [
  ['腾讯', 'https://join.qq.com/progress.html', '泡池子'],
  ['百度', 'https://talent.baidu.com/jobs/center', '泡池子'],
  ['网易', 'https://campus.163.com/app/personal/apply?tab=net', '泡池子'],
  [
    '4399',
    'https://hr.4399om.com/uc/person-center/my-delivery',
    '过了简历等面',
  ],
  ['蚂蚁', 'https://talent.antgroup.com/personal/campus-application', '泡池子'],
  [
    '小米',
    'https://xiaomi.jobs.f.mioffice.cn/campus/position/application?spread=J7NS6YR',
    '泡池子',
  ],
  [
    '美团',
    'https://zhaopin.meituan.com/web/personal-center/delivery-record',
    '泡池子',
  ],
  [
    '唯品会',
    'https://app-tc.mokahr.com/campus-recruitment/vipshophr/10039?sourceToken=d7b00ea2471aaddd55b3f402bb4fcc19&previewKey=5a77f111a2994afc9669a3d68a8d050f139d9b6d4aa142029d3a9f20a6eba005#/candidateHome/applications',
    '泡池子',
  ],
  ['虹科', 'https://hkaco.zhiye.com/personal/deliveryRecord', '泡池子'],
  ['腾讯音乐', 'https://join.tencentmusic.com/deliver', '泡池子'],
  [
    '华为',
    'https://career.huawei.com/cn/personal-center?pageType=myApplication&recType=CR',
    '泡池子',
  ],
  [
    '韶音',
    'https://app.mokahr.com/campus-recruitment/aftershokzhr/36940#/candidateHome/applications',
    '泡池子',
  ],
  [
    '荣耀',
    'https://career.honor.com/SU60eea919bef57c1023f6fe78/pb/account.html#/myDeliver',
    '泡池子',
  ],
  [
    'TCL',
    'https://wecruit.hotjob.cn/SU64893571bef57c16d356b99e/pb/account.html#/myDeliver',
    '泡池子',
  ],
  ['哈喽', 'https://hellobike.zhiye.com/personal/deliveryRecord', '泡池子'],
  ['传音控股', 'https://transsion.zhiye.com/personal/deliveryRecord', '泡池子'],
  ['卓驭', 'https://we.zyt.com/personal/deliveryRecord', '泡池子'],
  [
    '海能达',
    'https://app.mokahr.com/campus-recruitment/hytera/182194?locale=zh-CN#/candidateHome/applications',
    '泡池子',
  ],
  [
    '星环科技',
    'https://app.mokahr.com/campus_apply/transwarp/3196#/candidateHome/applications',
    '泡池子',
  ],
  ['信锐', 'https://hr.sundray.com.cn/#/candidateHome/applications', '泡池子'],
  [
    '顺丰',
    'https://campus.sf-express.com/#/personalCenter?activeTab=2',
    '泡池子',
  ],
  [
    '游卡',
    'https://app.mokahr.com/campus-recruitment/yokagames/41940#/candidateHome/applications',
    '泡池子',
  ],
  [
    '快手',
    'https://campus.kuaishou.cn/recruit/campus/e/#/campus/my-apply',
    '泡池子',
  ],
  [
    '面壁智能',
    'https://modelbest.jobs.feishu.cn/campus/position/application',
    '泡池子',
  ],
  ['长园', 'https://sznari.zhiye.com/personal/deliveryRecord', '泡池子'],
  ['携程', 'https://careers.ctrip.com/#/personal-homepage', '泡池子'],
  [
    '三一集团',
    'https://sanycampus.zhiye.com/personal/deliveryRecord',
    '待测评',
  ],
  ['水滴', 'https://wdh.jobs.feishu.cn/345030/position/application', '泡池子'],
  ['麦科田', 'https://medcaptain.zhiye.com/personal/deliveryRecord', '泡池子'],
  [
    '库洛',
    'https://kurogame.jobs.feishu.cn/campus/position/application',
    '笔试完',
  ],
  ['招商蛇口', 'https://cmsk1979.zhiye.com/personal/deliveryRecord', '泡池子'],
  [
    '大众',
    'https://app.mokahr.com/campus-recruitment/vwa/168597?locale=zh-CN#/candidateHome/applications',
  ],
  ['仙工智能', 'https://seer-group.jobs.feishu.cn/campus/position/application'],
  ['乾程', 'https://techen.zhiye.com/personal/deliveryRecord'],
  ['联友科技', 'https://szly.zhiye.com/personal/deliveryRecord'],
  [
    '杉数科技',
    'https://app.mokahr.com/campus-recruitment/shanshu/57987#/candidateHome/applications',
  ],
  ['亿联网络', 'https://yealink.zhiye.com/personal/deliveryRecord'],
  ['北方华创', 'https://career.naura.com/personal/deliveryRecord'],
  ['福建星网锐捷', 'https://starnet.zhiye.com/personal/deliveryRecord'],
  [
    '上海东方芯港集成电路',
    'https://xiaoyuan.zhaopin.com/scrd/phase/process?projectId=105475',
  ],
  ['神州信息', 'https://dcits.zhiye.com/personal/deliveryRecord'],
  ['e签宝', 'https://esign.zhiye.com/personal/deliveryRecord'],
  [
    'FunPlus',
    'https://app.mokahr.com/campus-recruitment/funplus01/147931#/candidateHome/applications',
  ],
  ['鹿客科技', 'https://lockin.zhiye.com/personal/deliveryRecord'],
  [
    'Shein',
    'https://app.mokahr.com/campus-recruitment/shein/2932#/candidateHome/applications',
  ],
];

function normalizeRecord(
  [company, portalUrl, sourceStatus]: (typeof rawApplications)[number],
  index: number,
): ApplicationRecord {
  let stage: CurrentStage = '待补充';
  if (sourceStatus === '泡池子') stage = '简历筛选';
  if (sourceStatus === '待测评') stage = '测评';
  if (sourceStatus === '笔试完') stage = '笔试';
  if (sourceStatus === '过了简历等面') stage = '面试';

  return {
    id: `app-${index + 1}`,
    company,
    portalUrl,
    stage,
    appliedAt: '2026-09-07',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  };
}

export const applications = rawApplications.map(normalizeRecord);
