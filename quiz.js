import { Z } from "../helpers.js";

export const quiz = [
  Z(
    `The woman ______ son won the competition is my English teacher.`,
    [`where`, `whose`, `which`, `who`],
    1,
    [
      `بنستخدم Where للمكان، مش للملكية.`,
      `لأننا بنتكلم عن ابن المرأة، وWhose بتدل على الملكية، وبعدها اسم Son.`,
      `Which بتستخدم مع الأشياء والحيوانات، مش للتعبير عن الملكية.`,
      `Who بتستخدم مع الأشخاص، لكن هنا محتاجين نوضح إن الابن ابن المرأة، مش نوصف المرأة بفعل.`
    ]
  ),
  Z(
    `This is the village ______ my grandfather was born.`,
    [`whose`, `which`, `where`, `who`],
    2,
    [
      `مفيش ملكية في الجملة.`,
      `لو استخدمنا Which لازم نضيف حرف الجر المناسب: in which.`,
      `لأن Village مكان، والجملة بعدها كاملة: My grandfather was born.`,
      `Who بتستخدم مع الأشخاص، مش الأماكن.`
    ]
  ),
  Z(
    `The architect ______ designs won several awards is very famous.`,
    [`where`, `whose`, `which`, `whom`],
    1,
    [
      `Where للمكان، لكن الجملة بتتكلم عن تصميمات المهندس.`,
      `لأن Designs بتاعة المهندس، ودي علاقة ملكية.`,
      `Which لا تعبر عن الملكية هنا.`,
      `Whom بتستخدم مع الأشخاص كمفعول به، ومش مناسبة قبل اسم Designs.`
    ]
  ),
  Z(
    `I want to visit a place ______ I can relax and enjoy nature.`,
    [`whose`, `who`, `where`, `whom`],
    2,
    [
      `مفيش ملكية.`,
      `Who للأشخاص، لكن Place مكان.`,
      `لأننا بنتكلم عن مكان نقدر نسترخي فيه، والجملة بعدها فاعل وفعل: I can relax.`,
      `Whom للأشخاص، ومش مناسبة للأماكن.`
    ]
  ),
  Z(
    `The plane had to land because ______ engine was out of order.`,
    [`whose`, `where`, `who`, `which`],
    0,
    [
      `لأن المحرك ملك للطائرة، وWhose بتستخدم للتعبير عن الملكية حتى مع غير العاقل.`,
      `Where للمكان، ومش مناسبة قبل اسم Engine.`,
      `Who للأشخاص.`,
      `Which لا تُستخدم هنا بدل صفة الملكية Its.`
    ]
  ),
  Z(
    `This is the school ______ I studied for six years.`,
    [`whose`, `where`, `who`, `whom`],
    1,
    [
      `مفيش ملكية في الجملة.`,
      `لأن School مكان، والجملة بعدها كاملة: I studied for six years.`,
      `Who للأشخاص.`,
      `Whom للأشخاص كمفعول به.`
    ]
  ),
  Z(
    `China is a country ______ exports exceed its imports.`,
    [`where`, `which`, `whose`, `who`],
    2,
    [
      `Where معناها حيث، لكن الجملة بتوضح إن الصادرات ملك أو تابعة للدولة.`,
      `Which لا تحل محل Its في تركيب الملكية ده.`,
      `لأن Exports هي صادرات الدولة، وWhose جت بدل Its.`,
      `Who للأشخاص، مش الدول.`
    ]
  ),
  Z(
    `The hotel ______ we stayed during our holiday was very comfortable.`,
    [`whose`, `where`, `who`, `whom`],
    1,
    [
      `مفيش علاقة ملكية.`,
      `لأن Hotel مكان، والجملة بتوضح المكان اللي أقمنا فيه.`,
      `Who للأشخاص.`,
      `Whom للأشخاص كمفعول به.`
    ]
  ),
  Z(
    `I met a boy ______ father works as an engineer.`,
    [`where`, `which`, `whose`, `whom`],
    2,
    [
      `Where للمكان، ومفيش مكان في الجملة محتاج وصف.`,
      `Which للأشياء، ومش بتدل على الملكية.`,
      `لأن Father هو والد الولد، وWhose بتوضح العلاقة والملكية.`,
      `Whom بتستخدم مع الأشخاص كمفعول به، لكن هنا محتاجين صفة ملكية قبل Father.`
    ]
  ),
  Z(
    `This is the house in ______ I spent my childhood.`,
    [`where`, `whose`, `which`, `who`],
    2,
    [
      `مينفعش نقول in where؛ لأن Where بتعوض حرف الجر + Which بالفعل.`,
      `Whose للملكية، ومفيش ملكية في الجملة.`,
      `لأن حرف الجر In موجود بالفعل قبل Which، والتركيب الصحيح هو In which.`,
      `Who للأشخاص، لكن House شيء غير عاقل.`
    ]
  )
];
