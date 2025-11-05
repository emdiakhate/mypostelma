export interface HashtagDomain {
  label: string;
  icon: string;
  hashtags: string[];
}

export const hashtagsDomains: Record<string, HashtagDomain> = {
  "mode-beaute": {
    label: "Mode & Beauté",
    icon: "✨",
    hashtags: [
      "#fashion", "#style", "#ootd", "#beauty", "#makeup",
      "#fashionista", "#instafashion", "#beautyblogger", 
      "#fashionblogger", "#styleinspo", "#fashiongram",
      "#beautytips", "#makeuptutorial", "#skincare", "#fashionweek"
    ]
  },
  "food-beverage": {
    label: "Food & Beverage",
    icon: "🍔",
    hashtags: [
      "#foodie", "#instafood", "#foodporn", "#delicious",
      "#yummy", "#foodphotography", "#foodstagram",
      "#foodlover", "#tasty", "#homemade", "#cooking",
      "#restaurant", "#chef", "#healthyfood", "#foodblogger"
    ]
  },
  "fitness-sport": {
    label: "Fitness & Sport",
    icon: "💪",
    hashtags: [
      "#fitness", "#workout", "#gym", "#fit", "#motivation",
      "#fitnessmotivation", "#training", "#health", "#muscle",
      "#exercise", "#bodybuilding", "#fitfam", "#healthy",
      "#sport", "#fitnesslife", "#fitnessgirl", "#gymlife"
    ]
  },
  "business-entrepreneur": {
    label: "Business & Entrepreneuriat",
    icon: "💼",
    hashtags: [
      "#entrepreneur", "#business", "#motivation", "#success",
      "#entrepreneurship", "#startup", "#businessowner",
      "#hustle", "#mindset", "#leadership", "#marketing",
      "#smallbusiness", "#businessman", "#entrepreneurlife"
    ]
  },
  "tech-digital": {
    label: "Tech & Digital",
    icon: "💻",
    hashtags: [
      "#tech", "#technology", "#innovation", "#digital",
      "#coding", "#programming", "#developer", "#software",
      "#ai", "#artificialintelligence", "#startup", "#techlife",
      "#geek", "#gadgets", "#techtrends", "#webdev"
    ]
  },
  "travel-lifestyle": {
    label: "Voyage & Lifestyle",
    icon: "✈️",
    hashtags: [
      "#travel", "#travelphotography", "#instatravel", "#lifestyle",
      "#wanderlust", "#travelgram", "#vacation", "#explore",
      "#adventure", "#nature", "#traveling", "#trip",
      "#photooftheday", "#instagood", "#lifestyleblogger"
    ]
  },
  "immobilier": {
    label: "Immobilier",
    icon: "🏡",
    hashtags: [
      "#realestate", "#immobilier", "#property", "#home",
      "#realtor", "#investment", "#luxuryhomes", "#architecture",
      "#houseforsale", "#dreamhome", "#realestateinvesting",
      "#homesforsale", "#realestateagent", "#propertyinvestment"
    ]
  },
  "education": {
    label: "Éducation & Formation",
    icon: "📚",
    hashtags: [
      "#education", "#learning", "#knowledge", "#teaching",
      "#study", "#school", "#student", "#teacher",
      "#onlinelearning", "#elearning", "#training",
      "#educational", "#learn", "#skills", "#studygram"
    ]
  },
  "art-creative": {
    label: "Art & Créativité",
    icon: "🎨",
    hashtags: [
      "#art", "#artist", "#creative", "#artwork", "#design",
      "#illustration", "#drawing", "#painting", "#artoftheday",
      "#instaart", "#artistsoninstagram", "#digitalart", "#sketch",
      "#contemporaryart", "#fineart"
    ]
  },
  "sante-bien-etre": {
    label: "Santé & Bien-être",
    icon: "🧘",
    hashtags: [
      "#health", "#wellness", "#selfcare", "#mentalhealth",
      "#healthylifestyle", "#wellbeing", "#mindfulness", "#yoga",
      "#meditation", "#healthyliving", "#nutrition", "#fitness",
      "#healthtips", "#wellnessjourney", "#healthcoach"
    ]
  }
};

export const getDomainHashtags = (domain: string): string[] => {
  return hashtagsDomains[domain]?.hashtags || [];
};

export const getAllDomains = (): Array<{ id: string; label: string; icon: string }> => {
  return Object.entries(hashtagsDomains).map(([id, domain]) => ({
    id,
    label: domain.label,
    icon: domain.icon
  }));
};
