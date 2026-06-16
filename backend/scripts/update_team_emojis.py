"""
Update teams with emoji flags as a fallback when external images are blocked.
This uses Unicode flag emojis which work everywhere without CORS issues.
"""
import asyncio
from sqlalchemy import select
from app.db.session import async_session_maker
from app.db.models.teams import Team

# Map team codes to flag emojis
TEAM_CODE_TO_EMOJI = {
    "ARG": "🇦🇷",  # Argentina
    "AUS": "🇦🇺",  # Australia
    "AUT": "🇦🇹",  # Austria
    "BEL": "🇧🇪",  # Belgium
    "BIH": "🇧🇦",  # Bosnia and Herzegovina
    "BRA": "🇧🇷",  # Brazil
    "CAN": "🇨🇦",  # Canada
    "CIV": "🇨🇮",  # Ivory Coast
    "COD": "🇨🇩",  # DR Congo
    "COL": "🇨🇴",  # Colombia
    "CPV": "🇨🇻",  # Cape Verde
    "CRO": "🇭🇷",  # Croatia
    "CUW": "🇨🇼",  # Curaçao
    "CZE": "🇨🇿",  # Czech Republic
    "ECU": "🇪🇨",  # Ecuador
    "EGY": "🇪🇬",  # Egypt
    "ENG": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",  # England
    "ESP": "🇪🇸",  # Spain
    "FRA": "🇫🇷",  # France
    "GER": "🇩🇪",  # Germany
    "GHA": "🇬🇭",  # Ghana
    "HAI": "🇭🇹",  # Haiti
    "IRN": "🇮🇷",  # Iran
    "IRQ": "🇮🇶",  # Iraq
    "JOR": "🇯🇴",  # Jordan
    "JPN": "🇯🇵",  # Japan
    "KOR": "🇰🇷",  # South Korea
    "KSA": "🇸🇦",  # Saudi Arabia
    "MAR": "🇲🇦",  # Morocco
    "MEX": "🇲🇽",  # Mexico
    "NED": "🇳🇱",  # Netherlands
    "NOR": "🇳🇴",  # Norway
    "NZL": "🇳🇿",  # New Zealand
    "PAN": "🇵🇦",  # Panama
    "PAR": "🇵🇾",  # Paraguay
    "POR": "🇵🇹",  # Portugal
    "QAT": "🇶🇦",  # Qatar
    "RSA": "🇿🇦",  # South Africa
    "SCO": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",  # Scotland
    "SEN": "🇸🇳",  # Senegal
    "SUI": "🇨🇭",  # Switzerland
    "SWE": "🇸🇪",  # Sweden
    "TUN": "🇹🇳",  # Tunisia
    "TUR": "🇹🇷",  # Turkey
    "URU": "🇺🇾",  # Uruguay
    "USA": "🇺🇸",  # United States
    "UZB": "🇺🇿",  # Uzbekistan
    "ALG": "🇩🇿",  # Algeria
}


async def update_emojis():
    """Update emoji field for all teams."""
    async with async_session_maker() as session:
        result = await session.execute(select(Team))
        teams = result.scalars().all()
        
        print(f"Found {len(teams)} teams")
        print()
        
        updated_count = 0
        
        for team in teams:
            if not team.code:
                print(f"⚠️  Skipping {team.name} - no code")
                continue
            
            emoji = TEAM_CODE_TO_EMOJI.get(team.code.upper())
            
            if emoji:
                # Clear logo_url and set emoji instead
                team.logo_url = None
                team.emoji = emoji
                print(f"✓ {team.name} ({team.code}): {emoji}")
                updated_count += 1
            else:
                print(f"⚠️  No emoji for {team.name} ({team.code})")
        
        await session.commit()
        
        print()
        print(f"✓ Done! Updated {updated_count} teams with emojis")


async def main():
    print("=" * 60)
    print("Update Team Emojis")
    print("=" * 60)
    print()
    
    await update_emojis()


if __name__ == "__main__":
    asyncio.run(main())
