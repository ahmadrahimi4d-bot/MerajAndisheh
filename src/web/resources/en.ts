import type { ResourceKey } from './fa';

/**
 * Partial experimental English translation dictionary for Stage 30.
 * Any key omitted here falls back automatically and safely to `faResources`.
 */
export const enResources: Partial<Record<ResourceKey, string>> = {
  // Brand & Global
  'app.name': 'Meraj Andisheh',
  'app.subtitle': 'Persian Educational Content Bank',
  'app.stageLabel': 'Stage {stage} of {total}',
  'app.footerNote': 'Meraj Andisheh Platform · Age-Adaptive Educational Content Bank',

  // Meta Titles
  'meta.titleFormat': '{page} | {site}',
  'meta.defaultDescription':
    'Meraj Andisheh — age-adaptive educational content bank with curated articles, films, books, and interactive learning games.',
  'meta.title.home': 'Home',
  'meta.title.catalog': 'Content Bank',
  'meta.title.films': 'Films & Documentaries',
  'meta.title.books': 'Books',
  'meta.title.search': 'Search',
  'meta.title.requests': 'Content Requests',
  'meta.title.health': 'System Health',

  // Header & Navigation
  'layout.header.searchPlaceholder': 'Search title, topic, or keyword...',
  'layout.header.searchAriaLabel': 'Search in Meraj Andisheh',
  'layout.header.searchAction': 'Search',
  'layout.header.ageGroupLabel': 'Age Group',
  'layout.header.personalize': 'Personalization',
  'layout.header.personalizeActive': 'Personalization On',
  'layout.header.personalizeInactive': 'Personalization Off',
  'layout.header.personalizeToggleAria': 'Toggle smart personalized recommendations',
  'layout.header.favoritesAriaLabel': 'Bookmarks',
  'layout.header.favoritesLabel': 'Bookmarks',
  'layout.header.favoritesCountAria': 'My Bookmarks ({count})',
  'layout.header.accountAction': 'Login / Account',
  'layout.header.profileAction': 'My Profile',
  'layout.header.changePasswordAction': 'Change Password',
  'layout.header.logoutAction': 'Logout',
  'layout.header.menuToggleAria': 'Toggle navigation menu',
  'layout.header.languageSwitchAria': 'Switch interface language',
  'layout.header.languageFaLabel': 'فارسی',
  'layout.header.languageEnLabel': 'EN',
  'layout.header.languageExperimentalNotice':
    'Experimental English mode is active; untranslated sections safely fall back to Persian.',
  'layout.header.languageFallbackLabel': 'Automatic Persian fallback is enabled for untranslated strings.',

  'layout.nav.categoriesButton': 'Browse Topics',
  'layout.nav.home': 'Home',
  'layout.nav.contentBank': 'Content Bank',
  'layout.nav.films': 'Films & Docs',
  'layout.nav.books': 'Books',
  'layout.nav.games': 'Educational Games',
  'layout.nav.requests': 'Content Requests',
  'layout.nav.health': 'System Health',
  'layout.nav.devComponents': 'Components Lab',
  'layout.nav.sampleNoticeTitle': 'Notice',
  'layout.nav.closeNotice': 'Dismiss',

  // Footer
  'layout.footer.studioTitle': 'Meraj Andisheh Studio',
  'layout.footer.studioDesc':
    'An age-adaptive Persian content bank designed for safe, fast, and accessible learning across mobile and desktop.',
  'layout.footer.quickAccessTitle': 'Quick Access',
  'layout.footer.linkHome': 'Home',
  'layout.footer.linkContentBank': 'Content Bank',
  'layout.footer.linkFilms': 'Films & Docs',
  'layout.footer.linkBooks': 'Books',
  'layout.footer.linkGames': 'Educational Games',
  'layout.footer.linkRequests': 'Content Requests',
  'layout.footer.linkAccount': 'Login / Account',
  'layout.footer.linkProfile': 'User Profile',
  'layout.footer.linkHealth': 'System Health',
  'layout.footer.linkComponents': 'Components Lab',
  'layout.footer.supportTitle': 'Guide & Policies',
  'layout.footer.noStaticPages': 'No guide pages have been published yet.',
  'layout.footer.linkAbout': 'About Us',
  'layout.footer.linkContact': 'Contact Us',
  'layout.footer.linkTerms': 'Terms of Use',
  'layout.footer.linkPrivacy': 'Privacy Policy',

  // Age Gate Header Strip
  'ageGate.headerSwitchLabel': 'Age: {name}',
  'ageGate.headerUnselectedLabel': 'Select Age Group',
  'ageGate.headerAriaLabel': 'Switch age group and adaptive theme',

  // Home Page
  'home.page.loading': 'Loading homepage slides and shelves...',
  'home.page.activeAgeStrip': 'Showing content tailored for: {age}',
  'home.page.unsetAgeStrip': 'All active age groups (Select age group)',
  'home.page.changeAgeLink': 'Change age group',
  'home.page.viewAllShelf': 'View all',
  'home.page.generalTopic': 'General',
  'home.page.trendingViewsBadge': '{count} views this week',
  'home.page.exploreCatalogButton': 'Explore Content Bank',
  'home.page.requestContentButton': 'Request Content',

  // Catalog & Filters
  'catalog.resultsCount': '{count} items found',
  'catalog.sort.label': 'Sort by:',
  'catalog.sort.latest': 'Latest',
  'catalog.sort.most_viewed': 'Most Viewed',
  'catalog.sort.most_liked': 'Most Liked',
  'catalog.filters.title': 'Filters',
  'catalog.filters.mobileButton': 'Filters',
  'catalog.filters.mobileButtonCount': 'Filters ({count})',
  'catalog.filters.clearAll': 'Clear all filters',
  'catalog.filters.section.topics': 'Topics',
  'catalog.filters.section.formats': 'Formats',
  'catalog.filters.section.tags': 'Tags',
  'catalog.filters.section.persons': 'Persons',
  'catalog.filters.section.impacts': 'Impact Level',
  'catalog.filters.section.ages': 'Target Age Group',

  // Content Formats
  'content.format.Video': 'Video',
  'content.format.Audio': 'Audio',
  'content.format.Article': 'Article',
  'content.format.Image': 'Image',
  'content.format.Pdf': 'PDF Document',
  'content.format.Presentation': 'Presentation',
  'content.format.Book': 'Book',
  'content.format.Film': 'Film',

  // Content Detail
  'contentDetail.meta.publishedAt': 'Published',
  'contentDetail.meta.viewCount': '{count} views',
  'contentDetail.meta.downloadCount': '{count} downloads',
  'contentDetail.meta.likeCount': '{count} likes',
  'contentDetail.meta.duration': '{minutes} min read / watch',
  'contentDetail.meta.impactLevel': 'Impact Level',
  'contentDetail.meta.targetAges': 'Suitable For',
  'contentDetail.meta.allAges': 'All Age Groups',
  'contentDetail.meta.backToBank': 'Back to Content Bank',
  'contentDetail.sources.title': 'Verified Sources & References',
  'contentDetail.related.title': 'Related Content',

  // Games Portal
  'games.portal.badge': 'HTML5 Educational Games Portal',
  'games.portal.exclusiveBadge': 'Meraj Andisheh Studio Exclusive',
  'games.portal.title': 'Meraj Andisheh Educational Games',
  'games.portal.openAction': 'Play Game',

  // Health i18n Card
  'health.card.i18n.title': 'Multilingual & Translation Coverage (fa / en)',
  'health.card.i18n.subtitle':
    'Experimental English dictionary coverage report with safe fallback to Persian',
  'health.card.i18n.activeLanguageLabel': 'Active Language',
  'health.card.i18n.totalKeysLabel': 'Total Source Keys (fa.ts)',
  'health.card.i18n.translatedKeysLabel': 'Translated Keys (en.ts)',
  'health.card.i18n.untranslatedKeysLabel': 'Untranslated Keys (Persian Fallback)',
  'health.card.i18n.coverageLabel': 'English Translation Coverage',
  'health.card.i18n.percentValue': '{percent}%',
  'health.card.i18n.toggleUntranslatedShow': 'Show {count} untranslated keys',
  'health.card.i18n.toggleUntranslatedHide': 'Hide untranslated keys',
  'health.card.i18n.downloadTxtButton': 'Download Report (.txt)',
  'health.card.i18n.downloadJsonButton': 'Download Report (.json)',
  'health.card.i18n.tableKeyHeader': 'Resource Key',
  'health.card.i18n.tableFaHeader': 'Persian Reference',
};
