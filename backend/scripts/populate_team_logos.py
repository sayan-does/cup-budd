"""
Script to populate team logos from FlagCDN API.
Uses ISO 3166-1 alpha-2 country codes to fetch flag images.
"""
import asyncio

from sqlalchemy import select

from app.db.models.teams import Team
from app.db.session import async_session_maker

# Mapping of team codes to ISO country codes (if different)
# Most team codes are already ISO 3166-1 alpha-2 codes
TEAM_CODE_TO_COUNTRY_CODE = {
    "ENG": "gb-eng",  # England
    "SCO": "gb-sct",  # Scotland
    "WAL": "gb-wls",  # Wales
    "NIR": "gb-nir",  # Northern Ireland
    # Add more mappings if needed
}

def get_flag_url(team_code: str) -> str:
    """
    Generate FlagCDN URL for a team based on its code.
    
    Args:
        team_code: Team code (usually ISO 3166-1 alpha-2)
    
    Returns:
        URL to the flag image
    """
    if not team_code:
        return None
    
    # Convert to lowercase for API
    code = team_code.lower()
    
    # Check if we need to map to a different country code
    if team_code.upper() in TEAM_CODE_TO_COUNTRY_CODE:
        code = TEAM_CODE_TO_COUNTRY_CODE[team_code.upper()]
    
    # Use w320 for good quality (options: w20, w40, w80, w160, w320, w640, w1280)
    return f"https://flagcdn.com/w320/{code}.png"


async def populate_logos():
    """Populate logo_url for all teams in the database."""
    async with async_session_maker() as session:
        # Get all teams
        result = await session.execute(select(Team))
        teams = result.scalars().all()
        
        print(f"Found {len(teams)} teams in database")
        
        updated_count = 0
        skipped_count = 0
        
        for team in teams:
            if not team.code:
                print(f"⚠️  Skipping {team.name} - no code")
                skipped_count += 1
                continue
            
            logo_url = get_flag_url(team.code)
            
            if team.logo_url != logo_url:
                team.logo_url = logo_url
                print(f"✓ Updated {team.name} ({team.code}): {logo_url}")
                updated_count += 1
            else:
                print(f"→ {team.name} ({team.code}): already set")
        
        # Commit changes
        await session.commit()
        
        print(f"\n✓ Done! Updated {updated_count} teams, skipped {skipped_count}")


async def main():
    """Run the logo population script."""
    print("=" * 60)
    print("Team Logo Population Script")
    print("=" * 60)
    print()
    
    await populate_logos()


if __name__ == "__main__":
    asyncio.run(main())
