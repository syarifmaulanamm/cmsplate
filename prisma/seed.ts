/**
 * Seed idempotent. Aman dijalankan berulang kali.
 * Jalankan: pnpm prisma db seed
 */
import { PrismaClient, type PostStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@simplecms.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";

function doc(paragraphs: string[]) {
  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  };
}

function toHtml(paragraphs: string[]) {
  return paragraphs.map((text) => `<p>${text}</p>`).join("\n");
}

type SeedTranslation = {
  title: string;
  slug: string;
  excerpt: string;
  paragraphs: string[];
  status: PostStatus;
  publishedAt: Date | null;
};

type SeedPost = {
  categorySlug: string;
  authorEmail: string;
  locales: { id: SeedTranslation; en?: SeedTranslation };
};

const now = new Date();

const posts: SeedPost[] = [
  {
    categorySlug: "panduan",
    authorEmail: ADMIN_EMAIL,
    locales: {
      id: {
        title: "Mulai menulis dengan alur yang tenang",
        slug: "mulai-menulis-dengan-alur-yang-tenang",
        excerpt:
          "Alur penulisan di CMSPlate dibuat agar kamu bisa fokus pada isi, bukan pada pengaturan.",
        paragraphs: [
          "Menulis konten yang baik butuh perhatian penuh. Karena itu, panel editor di CMSPlate dibuat sederhana: judul, isi, dan panel pendamping yang hanya muncul saat kamu butuh.",
          "Autosave berjalan setiap dua puluh detik sehingga kamu tidak perlu khawatir kehilangan perubahan. Setiap penyimpanan juga membuat revisi yang bisa dipulihkan.",
          "Mulailah dari satu paragraf. Tambahkan subjudul saat alur tulisan mulai bercabang. Biarkan panduan SEO menilai setelah draf selesai, bukan saat ide masih setengah jadi.",
        ],
        status: "PUBLISHED",
        publishedAt: now,
      },
      en: {
        title: "Start writing with a calmer workflow",
        slug: "start-writing-with-a-calmer-workflow",
        excerpt:
          "The writing flow in CMSPlate keeps your attention on the content, not on settings.",
        paragraphs: [
          "Good content needs full attention. That is why the CMSPlate editor stays simple: a title, the body, and a side panel that only appears when you need it.",
          "Autosave runs every twenty seconds, so you never have to worry about losing changes. Every save also creates a revision you can restore.",
          "Start with one paragraph. Add a subheading when the story branches. Let the SEO guidance score it after the draft is done, not while the idea is still half-formed.",
        ],
        status: "PUBLISHED",
        publishedAt: now,
      },
    },
  },
  {
    categorySlug: "produk",
    authorEmail: ADMIN_EMAIL,
    locales: {
      id: {
        title: "Kenapa analytics tanpa cookie lebih tenang",
        slug: "kenapa-analytics-tanpa-cookie-lebih-tenang",
        excerpt:
          "Statistik yang cukup untuk mengambil keputusan, tanpa menyimpan data pribadi pengunjung.",
        paragraphs: [
          "Kamu tidak perlu mengetahui identitas pengunjung untuk tahu halaman mana yang bekerja. Yang dibutuhkan hanya pola: halaman populer, sumber trafik, dan tren dari waktu ke waktu.",
          "CMSPlate menyimpan page view dengan hash harian, bukan alamat IP. Hash diputar setiap hari sehingga tidak bisa dipakai melacak orang yang sama dalam jangka panjang.",
          "Dengan pendekatan ini, kamu tetap bisa melihat performa konten sekaligus mengurangi beban kepatuhan privasi.",
        ],
        status: "DRAFT",
        publishedAt: null,
      },
    },
  },
];

async function main() {
  const passwordHash = await hash(ADMIN_PASSWORD, 12);

  const admin = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: "Sari Wulandari",
      passwordHash,
      role: "SUPER_ADMIN",
      locale: "id",
    },
  });

  const editor = await db.user.upsert({
    where: { email: "editor@simplecms.local" },
    update: {},
    create: {
      email: "editor@simplecms.local",
      name: "Bagas Pratama",
      passwordHash,
      role: "EDITOR",
    },
  });

  await db.user.upsert({
    where: { email: "author@simplecms.local" },
    update: {},
    create: {
      email: "author@simplecms.local",
      name: "Nadia Puspita",
      passwordHash,
      role: "AUTHOR",
    },
  });

  const categories = [
    {
      slug: { id: "panduan", en: "guides" },
      name: { id: "Panduan", en: "Guides" },
      description: {
        id: "Cara memakai dan mengembangkan CMS.",
        en: "How to use and extend the CMS.",
      },
    },
    {
      slug: { id: "produk", en: "product" },
      name: { id: "Produk", en: "Product" },
      description: {
        id: "Catatan rilis dan keputusan produk.",
        en: "Release notes and product decisions.",
      },
    },
    {
      slug: { id: "cerita", en: "stories" },
      name: { id: "Cerita", en: "Stories" },
      description: {
        id: "Pengalaman tim di balik layar.",
        en: "Behind-the-scenes stories from the team.",
      },
    },
  ];

  for (const [index, category] of categories.entries()) {
    const existing = await db.categoryTranslation.findUnique({
      where: { locale_slug: { locale: "id", slug: category.slug.id } },
    });

    const record = existing
      ? await db.category.update({
          where: { id: existing.categoryId },
          data: { position: index },
        })
      : await db.category.create({ data: { position: index } });

    for (const locale of ["id", "en"] as const) {
      await db.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: record.id, locale } },
        update: {
          name: category.name[locale],
          slug: category.slug[locale],
          description: category.description[locale],
        },
        create: {
          categoryId: record.id,
          locale,
          name: category.name[locale],
          slug: category.slug[locale],
          description: category.description[locale],
        },
      });
    }
  }

  for (const post of posts) {
    const translation = await db.categoryTranslation.findUniqueOrThrow({
      where: { locale_slug: { locale: "id", slug: post.categorySlug } },
    });

    const existing = await db.postTranslation.findUnique({
      where: { locale_slug: { locale: "id", slug: post.locales.id.slug } },
    });

    const record =
      existing !== null
        ? await db.post.update({
            where: { id: existing.postId },
            data: { categoryId: translation.categoryId },
          })
        : await db.post.create({
            data: {
              categoryId: translation.categoryId,
              authorId: post.authorEmail === ADMIN_EMAIL ? admin.id : editor.id,
            },
          });

    for (const locale of ["id", "en"] as const) {
      const content = post.locales[locale];
      if (!content) continue;

      const words = content.paragraphs.join(" ").split(/\s+/).length;

      await db.postTranslation.upsert({
        where: { postId_locale: { postId: record.id, locale } },
        update: {},
        create: {
          postId: record.id,
          locale,
          title: content.title,
          slug: content.slug,
          excerpt: content.excerpt,
          content: doc(content.paragraphs),
          contentHtml: toHtml(content.paragraphs),
          contentText: content.paragraphs.join("\n\n"),
          status: content.status,
          publishedAt: content.publishedAt,
          readTime: Math.max(1, Math.round(words / 200)),
          seoScore: 70,
        },
      });
    }
  }

  console.info("Seed selesai.");
  console.info(`  Super Admin : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.info("  Editor      : editor@simplecms.local / (password sama)");
  console.info("  Author      : author@simplecms.local / (password sama)");
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
