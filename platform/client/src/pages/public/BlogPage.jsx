import useDocumentTitle from '../../lib/useDocumentTitle.js';

const BLOG_POSTS = [
  {
    category: 'የፀጉር እና የቆዳ እንክብካቤ (Hair & Skin Care)',
    icon: '💇‍♀️',
    items: [
      { title: 'ለተለያየ የፀጉር አይነት (Type 4C, 4B...) የሚስማማ የኮንዲሽነር እና የሻምፖ አጠቃቀም', summary: 'እንዴት ድርቀትን መከላከል ይቻላል? ለፀጉር አይነትዎ የሚስማማውን ምርት እንዴት መምረጥ እንደሚቻል ዝርዝር መመሪያ።' },
      { title: 'አረብ ሀገር ባለው ውሃ ለሚሰባበር ፀጉር ተፈጥሯዊ የኢትዮጵያ የፀጉር ቅባቶች', summary: 'የተልባ እና የጉሎ ዘይት አጠቃቀም ለፀጉር ጤና ያላቸው ጥቅም።' },
      { title: 'ለደረቅ ፀጉር እርጥበት የሚሰጡ (Moisturizing) ምርጥ የቤት ውስጥ ውህዶች', summary: 'በተፈጥሮ ንጥረ ነገሮች ፀጉርዎን እርጥበት የሚሰጡ የቤት ውስጥ ውህዶች።' },
      { title: 'ለቅባት ፀጉር የሚሆኑ ቀላልና ፀጉርን የማያሳክኩ የሻምፖ አይነቶች', summary: 'ቅባት ፀጉርን ከመጠን በላይ ሳያደርቁ ንፁህ የሚያደርጉ ምርጥ ምርቶች።' },
      { title: 'የማድያት ማጥፊያ መንገዶች', summary: 'በአረብ ሀገር ፀሀይ ለተጎዳ ቆዳ ምርጥ የቆዳ እንክብካቤ (Skincare Routine)።' },
      { title: 'ለፊት ጥራትና ለወዝ የሚሆኑ ተፈጥሯዊ ሳሙናዎችና ክሬሞች አጠቃቀም መመሪያ', summary: 'ኬሚካል የሌላቸው ተፈጥሯዊ ምርቶችን በመጠቀም የፊት ቆዳን የማዝልቅ ዘዴዎች።' },
    ],
  },
  {
    category: 'የሰውነት ክብደት እና ጤና (Weight Management & Health)',
    icon: '💪',
    items: [
      { title: 'ክብደት ለመጨመር የሚረዱ ገንቢ የሀገር ባህል ምግቦች እና አዘገጃጀታቸው', summary: 'በሶ፣ አጃ እና ሌሎች ገንቢ ምግቦችን በመመገብ ጤናማ ክብደት ማግኘት።' },
      { title: 'ክብደት ለመቀነስ የሚረዱ በአረብ ሀገር በቀላሉ የሚገኙ ሻይዎችና የምግብ ቅነሳ ዘዴዎች', summary: 'ተፈጥሯዊ ሻይ እና የአመጋገብ ዘዴዎችን በመጠቀም ክብደት መቀነስ።' },
      { title: 'በስራ ብዛት ለሚዝል ሰውነት ጉልበት የሚሰጡ የተፈጥሮ ምግቦች እና ቫይታሚኖች', summary: 'ለረጅም ሰአታት ለሚሰሩ ሰዎች ጉልበት እና ጤና የሚሰጡ ምግቦች።' },
    ],
  },
  {
    category: 'የፋሽን እና የሰውነት ቅርፅ ስታይል (Fashion & Body Styling)',
    icon: '👗',
    items: [
      { title: 'የሰውነት ቅርፅሽን አውቀሽ ልብስ መምረጥ', summary: 'ለሰዓት መስታወት (Hourglass) ቅርፅ የሚሆኑ አልባሳት ምርጫ።' },
      { title: 'ለቀጫጫ ሰዎች ሰውነትን ሞላ አድርገው የሚያሳዩ ምርጥ የአለባበስ ስታይሎች', summary: 'ቀጫጫ ሰውነት ያላቸው ሰዎች ተመጣጣኝ ሆነው እንዲታዩ የሚረዱ የአለባበስ ምክሮች።' },
      { title: 'ለሙላት (Plus-Size) ሰዎች ቁመትና ውበትን የሚያጎሉ ዘመናዊ አልባሳት', summary: 'ፕላስ ሳይዝ ለሆኑ ሰዎች የሚሆኑ ፋሽን እና ዘመናዊ አልባሳት ምርጫ።' },
      { title: 'የባህል ልብሶችን ከዘመናዊ ፋሽን ጋር አቀናጅቶ መልበስ', summary: 'ሀበሻ ሞደርን ስታይል (Habesha Modern Style) የአለባበስ ዘዴዎች።' },
    ],
  },
  {
    category: 'የምግብ እና የባልትና ጣዕም (Food & Taste Reviews)',
    icon: '🍛',
    items: [
      { title: 'የኢትዮጵያ ምግቦች ጣዕም ደረጃ አሰጣጥ (Food Rating)', summary: 'ክትፎ፣ ጥብስ ወይስ ፍርፍር? የትኛው ምርጥ ነው? የጣዕም ንጽጽር።' },
      { title: 'የተመረጡ የባልትና ውጤቶች ጥራት እንዴት ይለካል?', summary: 'በርበሬ እና ሽሮ ጥራት ለመለየት የሚረዱ ምክሮች።' },
      { title: 'በአረብ ሀገር ሆነን በፍጥነት የምናዘጋጃቸው የ5 ደቂቃ የሀበሻ ቁርሶች', summary: 'በተጨናነቀ ጊዜ ውስጥ በቀላል እና ፈጣን መንገድ የሀበሻ ቁርስ ማዘጋጀት።' },
    ],
  },
  {
    category: 'ወደ አረብ ሀገር ለሚመጡ ሰዎች ዝግጅት (Travel & Mental Preparation)',
    icon: '✈️',
    items: [
      { title: 'ወደ አረብ ሀገር ለመጀመሪያ ጊዜ ሲመጡ በአካልና በስነ-ልቦና መዘጋጀት ያለባቸው 10 ዋና ዋና ነገሮች', summary: 'ለመጀመሪያ ጊዜ ወደ አረብ ሀገር ለሚሄዱ ሰዎች ሙሉ ዝግጅት መመሪያ።' },
      { title: 'በቤት ሰራተኝነት ለሚመጡ እህቶች ከአሰሪዎች ጋር በቀላሉ መግባቢያ ቋንቋዎችን የመልመድ ጥበብ', summary: 'ከአሰሪዎች ጋር ግንኙነትን ለማቀላጠፍ የቋንቋ መማር ምክሮች።' },
      { title: 'በውጭ ሀገር የስራ ጫናን እና የናፍቆት ስሜትን (Homesickness) የምንቋቋምባቸው ቀላል መንገዶች', summary: 'ከቤተሰብ እና ከሀገር ርቀው ለሚሰሩ ሰዎች የስነ-ልቦና ድጋፍ እና ምክሮች።' },
      { title: 'ከአረብ ሀገር ወደ ሀገር ቤት በሚመለሱበት ጊዜ ሊኖረን የሚገባ የቁጠባና የስራ እቅድ ዝግጅት', summary: 'ወደ ሀገር ቤት ሲመለሱ ኢኮኖሚያዊ ነፃነትዎን ለማስጠበቅ የሚረዱ የቁጠባ ምክሮች።' },
    ],
  },
];

export default function BlogPage() {
  useDocumentTitle(
    'Blog — Weynishop | Tips for Ethiopians Living in Arab Countries',
    'Discover hair care, skin care, weight management, fashion, food reviews, and travel tips for Ethiopians living in Arab countries on the Weynishop blog.'
  );

  return (
    <div className="max-w-page mx-auto px-3 md:px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 font-localized">
          የዌይኒሾፕ ብሎግ
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto" style={{ color: 'var(--color-muted)' }}>
          Weynishop Blog — ለአረብ ሀገር ለሚኖሩ ኢትዮጵያውያን ጠቃሚ ምክሮች እና መረጃዎች
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
          Tips, guides, and inspiration for Ethiopians living in Arab countries.
        </p>
      </header>

      <div className="space-y-12">
        {BLOG_POSTS.map((group) => (
          <section key={group.category}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>{group.icon}</span>
              <span>{group.category}</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {group.items.map((post) => (
                <article
                  key={post.title}
                  className="card p-5 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <h3 className="font-bold text-base mb-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                    {post.summary}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Coming Soon Banner */}
      <section className="mt-12 card p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(236,92,44,0.08), rgba(236,92,44,0.02))' }}>
        <h2 className="text-xl font-bold mb-3">ብዙም ሳይቆይ አዳዲስ ፅሁፎች ይዘን እንመጣለን!</h2>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          More blog posts coming soon — covering food recipes, lifestyle tips, community stories, and more. Stay tuned!
        </p>
      </section>
    </div>
  );
}