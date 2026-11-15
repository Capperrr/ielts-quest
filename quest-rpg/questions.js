/* IELTS QUEST original, human-reviewed learning data. No official IELTS score claims. */
(function(){
const Q=[];const add=(type, chapter, rows, fn)=>rows.forEach((row,i)=>Q.push({id:type+"-"+(i+1),type,chapter,...fn(row,i)}));
const gaps=[
["lead to serious _____ problems","environmental","environmental|environment|environmentally","引发严重的环境问题","形容词 environmental 修饰名词 problems。"],
["a significant _____ in expenditure","increase","increase|increasing|increased","支出显著增加","不定冠词后的名词结构为 a significant increase。"],
["play a crucial _____ in education","role","role|rule|roll","在教育中发挥关键作用","play a crucial role in 是固定搭配。"],
["have a negative _____ on well-being","impact","impact|imply|impacted","对幸福感有负面影响","have an impact on + 名词。"],
["an increasingly _____ issue","pressing","pressing|pressed|pressure","日益紧迫的问题","pressing 意为迫切的，修饰 issue。"],
["take effective _____ to reduce waste","measures","measures|measurements|measuring","采取有效措施减少浪费","take measures to do something 是自然的搭配。"],
["a _____ proportion of respondents","higher","higher|highly|height","更高比例的受访者","形容词比较级 higher 修饰 proportion。"],
["the number of visitors _____ sharply","rose","rose|raised|risen","游客数量急剧上升","rise 是不及物动词，过去式 rose。"],
["a gradual _____ in unemployment","decline","decline|declining|declined","失业率逐渐下降","a gradual decline 为名词短语。"],
["be closely _____ to health outcomes","linked","linked|linking|linkage","与健康结果密切相关","be linked to 表示与……相关。"],
["provide access _____ higher education","to","to|for|at","提供接受高等教育的机会","access to 是固定搭配。"],
["the benefits _____ the costs","outweigh","outweigh|outweight|overweigh","收益超过成本","outweigh 是及物动词，意为超过。"],
["the figure remained relatively _____","stable","stable|stability|stably","该数字保持相对稳定","remained 是系动词，后接形容词。"],
["a substantial _____ in public transport use","rise","rise|raise|risingly","公共交通使用量大幅上升","a substantial rise 是名词结构。"],
["contribute _____ climate change","to","to|with|of","加剧气候变化","contribute to + 名词。"]
];add("gap",0,gaps,r=>({prompt:r[0],options:r[2].split("|"),answer:r[1],translation:r[3],explain:r[4]}));
const match=[
["教育政策的关系","school funding|educational resources","teacher training|classroom instruction","access to libraries|independent learning"],
["环境与城市","vehicle emissions|air pollution","green spaces|urban biodiversity","recycling programmes|waste reduction"],
["科技与社会","remote work|commuting demand","digital literacy|online participation","automation|routine employment"],
["就业与经济","vocational training|practical skills","job insecurity|employee stress","flexible hours|work-life balance"],
["Task 1 趋势","rose steadily|持续上升","fell sharply|急剧下降","remained stable|保持稳定"],
["Task 1 比较","twice as high|两倍高","approximately equal|大致相等","the lowest figure|最低值"],
["论证结构","claim|中心观点","evidence|支撑证据","implication|进一步影响"],
["因果关系","heavy traffic|longer journeys","limited housing supply|higher rents","public investment|better infrastructure"],
["健康与生活","regular exercise|physical well-being","sleep deprivation|reduced concentration","balanced diets|nutrition"],
["公共服务","public libraries|community learning","accessible healthcare|early treatment","reliable buses|transport inclusion"],
["媒体传播","misinformation|public confusion","fact-checking|greater reliability","targeted advertising|personalised exposure"],
["文化与全球化","international exchange|cross-cultural understanding","language preservation|cultural continuity","tourism growth|local employment"],
["科学与农业","precision irrigation|water efficiency","crop diversification|resilience","soil degradation|lower yields"],
["写作表达","nevertheless|让步或转折","consequently|结果","for instance|举例"],
["观点验证","survey findings|empirical evidence","individual story|anecdotal illustration","counterargument|opposing perspective"]
];add("match",1,match,r=>({prompt:"请将以下三组表达正确配对："+r[0],pairs:r.slice(1).map(s=>s.split("|")),translation:"理解概念之间的准确对应关系。",explain:"按照语义或概念关系匹配，而不是仅依赖关键词外观。"}));
const orders=[
["建立一个完整的环境论证","Cities should expand reliable public transport.|This would make commuting without a car more practical.|As a result, dependence on private vehicles could fall."],
["解释灵活办公的影响","Flexible working can reduce commuting time.|Employees may use the saved time for family responsibilities.|This can improve work-life balance."],
["发展教育公平论点","Access to digital resources varies between schools.|Students in underfunded areas may have fewer learning opportunities.|Targeted investment could therefore narrow this gap."],
["分析广告影响","Advertising can influence children's preferences.|Young viewers may struggle to recognise persuasive intent.|Stronger media-literacy teaching could help them make informed choices."],
["构建城市交通因果链","Rapid urban growth increases demand for transport.|If services do not expand, overcrowding becomes more likely.|Longer and less reliable journeys may follow."],
["阐明卫生政策","Preventive healthcare can identify risks early.|Early intervention may reduce the severity of some conditions.|This can ease pressure on hospitals over time."],
["解释可再生能源","Renewable energy reduces reliance on fossil fuels.|Lower fossil-fuel use can cut associated emissions.|However, grid investment is also necessary."],
["解释职业教育","Vocational programmes provide practical workplace skills.|These skills can make school-to-work transitions easier.|Their value nevertheless depends on local labour demand."],
["分析语言学习","Studying another language requires regular practice.|Repeated use improves familiarity with vocabulary and structure.|Learners can then communicate with greater confidence."],
["解释社区公园","Public parks give residents space for exercise.|More accessible recreation may support healthier routines.|Parks also provide places for social interaction."],
["讨论远程教学","Online lessons can reach students in distant areas.|This reduces some geographical barriers to education.|Reliable internet access remains an important condition."],
["解释浪费问题","Restaurants sometimes prepare more food than they sell.|Unsold items may be discarded at the end of the day.|Better demand forecasting could reduce this waste."],
["社会媒体的局限","Social media makes information easy to share.|However, rapid sharing does not guarantee accuracy.|Users therefore need reliable ways to evaluate sources."],
["反对简单政策判断","Raising fuel prices may discourage some car journeys.|Yet people without alternatives may face higher living costs.|Effective policy should consider access to public transport."]
];add("order",1,orders,r=>({prompt:r[0]+"：按论证逻辑排列句子",pieces:r[1].split("|"),answer:r[1].split("|"),translation:"观点 → 解释 → 影响／限制",explain:"先提出可以讨论的论点，再解释机制，最后给出推论、限制或政策意义。"}));
const charts=[
["2019–2023年图书馆访客(千人)",[20,24,29,33,41],"rose","总体上升","访客由20增至41，整体呈增长趋势。"],
["2018–2022年用水量(百万升)",[50,46,39,34,28],"fell","总体下降","数字由50降至28，整体呈下降趋势。"],
["A城四种通勤方式(%)",[45,28,17,10],"max-first","第一类占比最高","第一项45%，高于其他类别。"],
["2020–2024年电动车销量(千台)",[8,10,15,24,38],"rose","总体上升","销量逐年增加，末年达到38。"],
["五年失业率(%)",[7,7,6,6,6],"fell","略有下降后趋稳","从7%降至6%，随后稳定。"],
["城市绿地面积(公顷)",[30,30,30,30,30],"stable","保持不变","所有年份均为30。"],
["四类能源占比(%)",[12,38,34,16],"max-second","第二类占比最高","第二项38%是最大值。"],
["2017–2021年旅游人数(万人)",[62,68,71,35,49],"mixed","先上升，后骤降，再恢复","先由62升至71，随后降至35，再回升至49。"],
["三家商店每月销售额(千镑)",[25,32,22],"max-second","第二家最高","第二家32高于第一家25和第三家22。"],
["2015–2019年铁路客运(百万人次)",[11,14,16,18,21],"rose","持续上升","数值逐年增加，没有逆转。"],
["2019–2023年塑料垃圾量(万吨)",[40,37,34,30,25],"fell","持续下降","由40降到25，整体稳步减少。"],
["四个年龄组网购比例(%)",[18,52,66,43],"max-third","第三组最高","第三项66%为四组最高值。"],
["2020–2024年博物馆人数(万人)",[14,9,11,16,19],"mixed2","先下降，随后回升","先从14降至9，然后连续增长至19。"],
["四个区域公园数量",[8,15,12,5],"max-second","第二区域最多","第二区域15个，高于其余地区。"]
];const chartOptions=["总体上升","总体下降","保持不变","第一类占比最高","第二类占比最高","第三组最高","先上升，后骤降，再恢复","先下降，随后回升","略有下降后趋稳","持续上升","持续下降","第二区域最多","第二家最高"];add("chart",2,charts,r=>({prompt:"观察实际图表，选择最准确的描述："+r[0],values:r[1],answer:r[3],options:[r[3],...chartOptions.filter(x=>x!==r[3]).slice((r[1][0]%7),((r[1][0]%7)+3))].slice(0,4),translation:r[0],explain:r[4]}));
const overviews=[
["两种产品销量都增长，但A增长更快。","Overall, sales of both products increased, with a faster rise in Product A.","Product A was sold on Monday at 10 am.","There were many products in the shop.","主要概括整体趋势及组间差异。"],
["城市人口在五年间持续增长。","Overall, the city's population grew throughout the period.","The population was exactly 300 in the first year.","The city has many interesting people.","Overview应总结贯穿时期的主要特征。"],
["汽车使用比例下降，公交比例上升。","Overall, car use declined while public transport gained a larger share.","A particular bus line opened in June.","Car owners should pay more tax.","不能把个人建议写成图表概述。"],
["三个国家的能源消费中，A始终最高。","Overall, Country A recorded the highest energy consumption throughout.","Country A had a value of 40 in 2015.","Countries should use less energy.","概述应突出贯穿全图的重要比较。"],
["四组收入中最高组远超最低组。","Overall, a substantial gap separated the highest and lowest income groups.","The first respondent was 34 years old.","Low incomes are unfair.","概述不应加入图表没有提供的观点。"],
["购物中心经历初期下降与后期恢复。","Overall, visitor numbers fell initially before recovering later in the period.","Exactly 12 people visited on Tuesday.","Shopping is a popular hobby.","概述把握阶段性变化。"],
["地图显示住宅区改为商业和公共设施。","Overall, the area became more developed, with new commercial and public facilities replacing housing.","The supermarket is next to the road.","Residents will certainly be happier.","地图概述描述主要用途转变，不做主观推断。"],
["流程图展示食品从原料到包装的线性流程。","Overall, the process consists of a sequence of stages, beginning with raw materials and ending with packaging.","The machine has a blue switch.","Packaging is the most important stage.","流程图概述适合总结阶段数、起点终点及循环与否。"],
["两条趋势线在后期逐渐接近。","Overall, the difference between the two series narrowed over time.","Both lines were blue.","The lines prove that prices are fair.","概述关注两个数据系列之间的主要关系。"],
["男女参与率均提高，女性增幅更大。","Overall, participation rose for both groups, particularly among women.","One man attended in 2020.","Women should participate more.","概述突出共性及显著差异。"],
["图表显示服务业始终为最大就业部门。","Overall, services remained the largest employment sector across the period.","Services employed 56 people in March.","The service sector is better than manufacturing.","图表中数据大小不能转成价值判断。"],
["流程图包含收集、分类、清洗、加工、再利用。","Overall, recycling involves several successive stages from collection to the production of reusable materials.","Collection happened on a sunny day.","Recycling is always inexpensive.","流程图概述主要过程，避免虚构时间和成本。"],
["三个区域中的住房价格都上升。","Overall, housing prices increased in all three areas over the period.","One house cost £100,000 in 2018.","People should move away.","保持客观并概括普遍趋势。"],
["地图中公园面积扩大，停车场缩小。","Overall, green space expanded while the area used for parking was reduced.","The parking spaces were painted white.","The park is definitely safer.","地图题概述关注空间用途的主要变化。"]
];add("overview",2,overviews,r=>({prompt:"根据这一整体特征选出合适的 Task 1 Overview："+r[0],options:[r[1],r[2],r[3]],answer:r[1],translation:r[0],explain:r[4]}));
const keywords=[
["Some people believe university education should be free for everyone. To what extent do you agree or disagree?",["university education","free for everyone","agree or disagree"],["school uniforms","primary education"],"必须评价大学教育免费政策并明确立场。"],
["Some people think governments should invest more in public transport than roads. Discuss both views and give your opinion.",["governments","public transport versus roads","discuss both views","your opinion"],["private shopping"],"比较公共交通与道路投资，并给出自己的观点。"],
["Many children spend more time online than outdoors. Is this a positive or negative development?",["children","online versus outdoors","positive or negative"],["retirement"],"需要评价这一变化的利弊并作判断。"],
["Some people say advertising encourages unnecessary purchases. Do you agree or disagree?",["advertising","unnecessary purchases","agree or disagree"],["farm exports"],"讨论广告与非必要消费之间的关系。"],
["What are the causes of traffic congestion, and what solutions can governments introduce?",["traffic congestion","causes","solutions","governments"],["university fees"],"题目同时要求原因和政府可采取的解决办法。"],
["Some think remote working benefits employees, while others think it weakens teamwork. Discuss both views.",["remote working","employee benefits","teamwork","both views"],["school canteens"],"讨论远程工作的员工收益与团队合作问题。"],
["In some cities, housing has become unaffordable. What problems does this cause, and how can they be addressed?",["housing affordability","problems","solutions"],["air travel"],"要分析可负担性导致的影响及应对。"],
["Governments spend large sums on space research. Is this a good use of public money?",["government spending","space research","public money","evaluation"],["school meals"],"需要评价公共资金是否应投入太空研究。"],
["Some people think museums should be free; others believe visitors should pay. Discuss both views and give your opinion.",["museums","free access versus fees","both views","your opinion"],["work uniforms"],"比较免票和收费，并给出判断。"],
["More people are choosing to live alone. What are the advantages and disadvantages?",["living alone","advantages","disadvantages"],["factory automation"],"分析独居生活的优势和劣势。"],
["Some argue that technology makes learning easier. Others believe it distracts students. Discuss both sides.",["technology","learning benefits","distraction","both sides"],["ocean fishing"],"正反观点均应得到充分回应。"],
["Many countries rely heavily on tourism. What are the benefits and drawbacks?",["tourism reliance","benefits","drawbacks"],["hospital waiting times"],"分析依赖旅游业的利弊。"],
["Some people think the best way to protect the environment is to increase fuel prices. To what extent do you agree?",["environmental protection","fuel prices","agree or disagree"],["teacher salaries"],"明确评价提高油价是否为最佳环保方式。"],
["In some places, young people move to large cities for work. Why does this happen, and what are its effects?",["young people","moving to cities","reasons","effects"],["food packaging"],"回答迁移原因和影响两部分。"]
];add("keyword",3,keywords,r=>({prompt:"选出这道 Task 2 题目必须回应的所有要点：\n"+r[0],required:r[1],options:[...r[1],...r[2]],translation:"审题侦探：多选，可反复点击切换。",explain:r[3]}));
const edits=[
["The number of students have increased in recent years.","The number of students has increased in recent years.","The number of students have increase in recent years.","The number of students has increasing in recent years.","The number of + 复数名词作主语，谓语通常使用单数。"],
["More people use buses, this reduce congestion.","More people use buses, which can reduce congestion.","More people use buses this reducing congestion.","More people use buses, that reduces congestion.","用关系从句说明可能的结果，且避免逗号拼接。"],
["The graph shows that spending rose by 10% to 30%.","The graph shows that spending rose from 20% to 30%.","The graph shows that spending rose by 30% from 20%.","The graph shows a 30% rise by 10%.","由20%到30%是增加10个百分点，必须区别幅度和终值。"],
["Education is important because important for jobs.","Education is important because it can improve employment opportunities.","Education important for because jobs.","Education is important jobs cause education.","给出实际机制，避免同义反复。"],
["The data proves that all students prefer online learning.","The data suggests a preference for online learning among the surveyed students.","The data proving all students prefer online learning.","The data proves online learning is best for all.","样本数据不能直接推广到所有学生。"],
["In 2022, the sales was 25 units.","In 2022, sales were 25 units.","In 2022, sales is 25 unit.","In 2022, sale are 25 units.","sales 为复数，过去时间用 were。"],
["There was a dramatically increase in traffic.","There was a dramatic increase in traffic.","There was a dramatically increasing in traffic.","There was a drama increase in traffic.","形容词 dramatic 修饰名词 increase。"],
["The percentage of workers rose from 20 to 35, clearly.","The percentage of workers rose from 20% to 35%.","The percentage of workers increased by 35% to 20%.","The workers percentage were 20 to 35.","表达百分比时清晰保留单位和起点终点。"],
["Some think online classes are bad. Some think online classes are bad.","One concern is that online classes may limit face-to-face interaction.","Online classes bad, so online classes bad.","Online class is bad and bad.","删除重复判断，补充可讨论的具体原因。"],
["Cars cause pollution. Therefore, all cars should be banned immediately.","Cars produce emissions, so better public transport could help reduce dependence on them.","Cars pollute, hence cars are always unnecessary.","Cars are a problem, therefore the only answer is a total ban.","因果链需支持政策建议，避免未经论证的极端结论。"],
["Overall, the figure was 20 in January, 22 in February and 25 in March.","Overall, the figure increased gradually during the period.","Overall, the figure was 20 in January.","Overall, there are January, February and March.","Overview优先概括总体趋势，具体数字可放主体段。"],
["The number of visitors were stable from 2019 to 2021.","The number of visitors remained stable from 2019 to 2021.","The number of visitors staying stability from 2019 to 2021.","Visitor numbers was stable from 2019 to 2021.","number 为单数主语，且 remained stable 是自然搭配。"],
["The chart illustrates how many money people spent.","The chart illustrates how much money people spent.","The chart shows how many money was spent.","The chart shows people spent many money.","money 是不可数名词，应使用 much。"],
["A policy can help the environment, because it helps the environment.","The policy could cut emissions by encouraging people to use public transport.","A policy helps because the environment is helped.","The policy is positive since it is good.","用具体作用机制替代循环论证。"]
];add("edit",3,edits,r=>({prompt:"修复这段存在语法或论证问题的表达：\n“"+r[0]+"”",options:r.slice(1,4),answer:r[1],translation:"段落修复",explain:r[4]}));
const choices=[
["哪个句子给出清晰可论证的观点？","Public libraries can reduce barriers to independent learning.","Libraries are very nice.","Books exist in many countries.","观点应具体、可解释且与问题相关。"],
["哪个例子最能支持‘公交通勤更便宜’？","A monthly bus pass costs less than regular car parking for some commuters.","Buses have windows.","Some people like travelling.","例子应直接提供与花费有关的证据。"],
["哪个理由能解释线上教育的局限？","Students without reliable internet may struggle to attend classes.","Online classes happen online.","Education is good.","说明具体的可及性机制。"],
["哪个表达适合客观的Task 1？","The percentage rose from 15% to 25%.","The percentage grew wonderfully.","The figure is definitely too high.","使用可核对的数据和中性语言。"],
["哪个句子包含让步？","Although remote work offers flexibility, it can complicate informal collaboration.","Remote work is flexible and popular.","Remote work is flexible, therefore everyone loves it.","although 用于承认对立的一面。"],
["哪个论据更适合支持节能政策？","Energy-efficient buildings can reduce electricity demand over time.","Energy efficiency sounds fashionable.","All buildings are equally efficient.","给出清晰机制而非空泛评价。"],
["哪项是有效的Task 2反驳方式？","Acknowledge the concern, then explain why it is less persuasive in this context.","Ignore the opposing argument.","Repeat your original claim louder.","回应反对意见需要实质性推理。"],
["哪个例子可以支撑社区运动设施的价值？","Affordable sports centres allow more residents to exercise regularly.","Sports are fun.","People buy trainers.","具体描述设施如何影响运动机会。"],
["哪句最好解释食品浪费的原因？","Inaccurate demand forecasts can leave retailers with unsold perishable products.","Food waste happens because food is wasted.","All retailers waste the same amount.","解释实际原因而非重复结论。"],
["哪句适合比较两个数据组？","The figure for City A was nearly twice that for City B.","City A was extremely amazing.","Both cities were very impressive.","描述数量关系而非价值判断。"],
["哪句结论避免过度推断？","The survey indicates a preference among its respondents.","The survey proves everyone agrees.","The survey makes all future outcomes certain.","结论范围要与证据范围一致。"],
["哪个观点更符合‘问题与解决方案’任务？","Traffic congestion can delay commuters; improving bus frequency may reduce car use.","Transport is a very important subject.","Cars, buses and trains are different.","同时提出问题、影响与可论证的对策。"],
["哪句更自然表达因果？","As housing costs rise, some young adults may delay moving out.","Housing costs rise and always everyone moves.","Housing cost expensive so young adults.","因果关系需要语法准确且避免绝对化。"],
["哪句体现了分析的局限？","The policy may be effective where reliable transport alternatives exist.","The policy is perfect in every country.","The policy can never have any effect.","限定条件能够提升论证准确性。"]
];add("choice",4,choices,r=>({prompt:r[0],options:r.slice(1,4),answer:r[1],translation:"综合写作训练",explain:r[4]}));
const qCount={};Q.forEach(q=>qCount[q.type]=(qCount[q.type]||0)+1);
const failures=[], ids=new Set();Q.forEach(q=>{if(ids.has(q.id))failures.push("重复ID "+q.id);ids.add(q.id);if(!q.prompt||!q.explain||!q.translation)failures.push("缺少内容 "+q.id);if(q.options&&!q.options.length)failures.push("选项缺失 "+q.id);if(q.answer&&q.options&&!q.options.includes(q.answer))failures.push("答案不在选项 "+q.id);if(q.type==="chart"&&(!q.values||q.values.length<3))failures.push("图表缺失 "+q.id);});
window.QUEST_QUESTIONS=Q;
window.QUEST_BANK_META={total:Q.length,byType:qCount,validationErrors:failures};
})();