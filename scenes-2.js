import { M, S, Q, scene } from "../helpers.js";

export const scenes2 = [
  scene("المشهد 4: ضمير الوصل whom", [
    M(`📌 whom تحل محل مفعول به عاقل (أي بعدها فاعل)، ويمكن حذفها وتُفهم من سياق الكلام، وكذلك يمكن أن نسبقها بحرف جر.

whom هي نفس فكرة who، لكن للإنسان لما يكون مفعول. يعني بعدها فاعل مش فعل. خلينا نشوف مثال بالتفصيل:

The driver had an accident. We were talking about him.

العامل المشترك هو him (بيرجع على the driver)، وهو مفعول (about him). ممكن نكتبها بثلاث صيغ:

1. The driver who / whom we were talking about had an accident.
2. The driver we were talking about had an accident.
3. The driver about whom we were talking had an accident.`),
    S(`الصيغة الأولى فيها who وwhom مع بعض. إزاي الاتنين صح؟`),
    M(`whom هي الأصل لأن الإنسان هنا مفعول، وwho بتتستخدم كبديل أقل رسمية في الكلام. بس خلينا ناخد بالنا من نقطة مهمة:

حيلة امتحان:
لو حرف الجر قدام الضمير (we were talking about ___)، يبقى whom فقط، ومستحيل who.`),
    S(`ليه في الصيغة الأولى حرف الجر (about) فضل في آخر الجملة، وفي التالتة اتنقل قدام whom؟`),
    M(`نرجع للجملة الأصلية:
We were talking about him.

حرف الجر about مرتبط بالضمير him. لما نحول him لـ whom ممكن نعمل واحد من اتنين:

نـسيب about في مكانه في آخر الجملة:
The driver whom we were talking about had an accident.

أو ننقله قدام whom:
The driver about whom we were talking had an accident.

والصيغة التانية (من غير ضمير أصلًا) بتحذف whom، وحرف الجر يفضل في آخر الجملة.`),
    S(`لو حرف الجر اتنقل قدام whom ينفع نحذف whom؟`),
    M(`لأ، ممنوع. لو حرف الجر قدام الضمير، الضمير لازم يفضل.

❌ The driver about we were talking.

غلط، لأن حرف الجر مش هينفع يفضل لوحده من غير حاجة يتعلق بيها. أما لو حرف الجر في آخر الجملة، فالحذف ممكن.

نشوف مثال تاني:

She married the man. She loved him.

1. She married the man whom she loved.
2. She married the man she loved. (محذوف الضمير)

الضمير whom ← him، وهو مفعول لأن بعده she (فاعل). ولأن مفيش حرف جر، الحذف ممكن.

ومثال تالت، وفيه حرف جر:

The men were honest. I lived with them in London.

1. The men whom I lived with in London were honest.
2. The men with whom I lived in London were honest.
3. The men I lived with in London were honest. (الضمير حذف)

نفس الأنماط التلاتة اللي في مثال السواق. خلينا نلخص النمط ده، لأنه هيتكرر مع which كمان:

Either of – neither of – any of – none of + whom

📌 Either of – neither of – any of – none of + whom (للأشخاص)

I have two brothers, none of whom is a doctor.`),
    S(`الشكل ده غريب. الصيغة دي بتتكون إزاي؟`),
    M(`نبدأ من الجملتين الأصليتين:

I have two brothers.
None of them is a doctor.

العامل المشترك هنا مش "them" لوحدها، لكن them of none كله. فبدل them بنحط whom، وبنفضل ماسكين none of قدامها:

I have two brothers, none of whom is a doctor.

الفكرة إن الجملة التانية بتتكلم عن جزء أو عدد من مجموعة الأشخاص اللي في الجملة الأولى. ومن غير كلمة but، لأن whom هي نفسها اللي بتربط الجملتين.`),
    S(`وليه whom مش who؟ ما هم أشخاص.`),
    M(`لأن فيه حرف جر (of) قدام الضمير، وقاعدتنا بتقول ممنوع حرف جر قبل who. فمفيش غير whom. ونفس الفكرة مع الأشياء، بس مع which:

I bought two bags, neither of which was cheap.`)
  ]),

  scene("المشهد 5: ضمير الوصل which", [
    M(`📌 which تحل محل فاعل (أي بعدها فعل) أو مفعول به (أي بعدها فاعل) لكن غير عاقل في الجملة التانية، ويمكن أن يسبقها حرف جر.

which هي ضمير الأشياء والحيوانات (غير العاقل)، وبتشتغل فاعل ومفعول زي who وwhom مع بعض. والفرق إنها مش بتتغير بين الحالتين.

1. which كفاعل (بعدها فعل):

That's the book which / that is a best seller.

هنا بعد which جه فعل is، يبقى which فاعل. وعشان كده ممكن تتبدل بـ that. ومينفعش نحذفها لأنها فاعل.

2. which كمفعول (بعدها فاعل):

The film was boring. I watched it last night.

1. The film, which I watched last night, was boring.
2. The film I watched last night was boring.

العامل المشترك it مفعول (I watched it)، وبعد which جه I (فاعل). يبقى which مفعول وممكن تتحذف. ونلاحظ إننا شلنا it من الجملة التانية.

⚠️ غلطة شائعة:
❌ The film which I watched it last night was boring.
لأن it متكررة بجانب which. العامل المشترك لازم يتحذف.`),
    S(`طب ومع حرف الجر في which؟ زي ما حصل مع whom؟`),
    M(`نفس النمط بالظبط:

I found the camera. You were looking for it.

1. I found the camera which you were looking for.
2. I found the camera you were looking for.
3. I found the camera for which you were looking.

زي whom: حرف الجر إما في الآخر (مع which أو مع الحذف)، أو قدام which، وفي الحالة الأخيرة ممنوع الحذف.`),
    S(`فيه أفعال بتيجي دايمًا مع حرف جر معين زي (prepare for – reply to – object to – apologize for – know about – depend on) إزاي بتتصرف دي الجمل مع which؟`),
    M(`دي أفعال بتيجي دايمًا مع حرف جر معين (verb + preposition). وحرف الجر بتاعها هو اللي بيتحرك قدام whom/which أو بيفضل في الآخر. والنقط معناها إن القايمة مش بس دي، وفيه أفعال تانية كتير زي look for وtalk about.

The plan was rejected. He objected to it.

The plan to which he objected was rejected.
The plan which he objected to was rejected.
The plan he objected to was rejected.

The letter was important. I replied to it.

The letter to which I replied was important.

حيلة:
عشان نعرف حرف الجر المناسب، نبص على الفعل في الجملة التانية ونشوف حرف الجر المرتبط بيه (prepare for، reply to، object to).... هو ده اللي بيروح قدام which أو بيفضل في الآخر.`),
    S(`وفي مثال زي:
That is the stadium at which we saw the cup final.
هنا حرف الجر مش مرتبط بفعل.`),
    M(`ملاحظة ذكية جدًا. هنا at بتدل على المكان (at the stadium).
We saw the cup final at it.

ولما حولنا it لـ which بقى at which. ده نفس الأساس: حرف الجر بيروح مع الضمير. وفكرة المكان دي هنكمل فيها لما نوصل لـ where.`),
    Q(
      `اربط الجملتين:`,
      `He passed the exam. This pleased his parents.`,
      [
        `He passed the exam, which pleased his parents.`,
        `He passed the exam, who pleased his parents.`,
        `He passed the exam, that pleased his parents.`,
        `He passed the exam, what pleased his parents.`
      ],
      0,
      `العامل المشترك This بيرجع على الحدث كله (نجح في الامتحان)، وده غير عاقل، فنحتاج which وفاصلة قبلها.

B غلط لأن who للعاقل.

C غلط لأن that مش بتيجي بعد فاصلة.

D غلط لأن what مش ضمير وصل بيربط بعد فاصلة، وهنشوف الفرق بينها وبين which كمان شوية.`
    )
  ]),

  scene("المشهد 6: ضمير الوصل اللي بيرجع على الجملة كلها", [
    M(`فاكرين القاعدة الخامسة اللي سبناها معلقة؟ دلوقتي هنشرحها بالأمثلة:

لو ضمير الوصل بيرجع على الجملة اللي قبله كلها بنختار which.

She came first, which made her parents pleased.

He played a long game of tennis with his brother, which made him tired.`),
    S(`لحد دلوقتي ضمير الوصل كان بيرجع على اسم. إزاي يرجع على جملة كاملة؟`),
    M(`نرجع لخطوات الحل. عندنا جملتين:

She came first.
This made her parents pleased.

العامل المشترك هنا هو This، وهي مش بترجع على اسم معين، بل على الحدث كله: إنها جت الأولى.

فبنحط which بدل This ونربط الجملتين:

She came first, which made her parents pleased.

الفكرة: which هنا معناها "وده/الأمر ده" (ومن غير فاعل جديد).`),
    S(`ما parents دي ناس، فليه مش who؟`),
    M(`لأن parents مش هي اللي ضمير الوصل بيرجع عليها. هي المفعول بتاع made. الضمير راجع على She came first، يعني حدث، وده غير عاقل، فنختار which. نسأل نفسنا دايمًا: الضمير بيرجع على إيه بالظبط؟`),
    S(`المثال التاني فيه brother، وهو إنسان وقريب من which. ليه ما استخدمناش who؟`),
    M(`ده فخ الامتحان في القاعدة دي. المعنى بيقول إن اللي خلّاه تعبان هو لعب التنس طول الوقت، مش أخوه. فالضمير راجع على الجملة كلها (He played a long game of tennis with his brother).

حيلة:
نجرب نبدل which بـ "and this":

He played a long game of tennis with his brother, and this made him tired.

المعنى سليم، يبقى which راجعة على الجملة كلها.`),
    S(`إيه اللي بيميز الحالة دي في الشكل؟`),
    M(`تالت حاجات:

1. فاصلة قبل which دايمًا.
2. الفعل اللي بعدها بيكون في العادة مفرد، لأن الحدث واحد (which makes / which made).
3. ممنوع نستخدم that مكانها، لأن that ما بتيجيش بعد فاصلة.

The lift was out of order, which made us use the stairs.

❌ She came first, that made her parents pleased.

❌ She came first, what made her parents pleased.

✅ She came first, which made her parents pleased.`)
  ])
];
