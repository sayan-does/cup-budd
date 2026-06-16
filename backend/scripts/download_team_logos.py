"""
Script to download team logos locally and update database to reference local files.
"""
import asyncio
import aiohttp
from pathlib import Path
from sqlalchemy import select
from app.db.session import async_session_maker
from app.db.models.teams import Team

# Where to save logos (relative to frontend public directory)
LOGOS_DIR = Path(__file__).parent.parent.parent / "frontend" / "public" / "logos"

# Mapping of team codes to ISO country codes
TEAM_CODE_TO_COUNTRY_CODE = {
    "ENG": "gb-eng",
    "SCO": "gb-sct",
    "WAL": "gb-wls",
    "NIR": "gb-nir",
}


async def download_logo(session: aiohttp.ClientSession, team_code: str, output_path: Path) -> bool:
    """
    Download a flag from Flagpedia (more reliable than FlagCDN).
    
    Args:
        session: aiohttp session
        team_code: Team code
        output_path: Where to save the file
    
    Returns:
        True if successful, False otherwise
    """
    code = team_code.lower()
    if team_code.upper() in TEAM_CODE_TO_COUNTRY_CODE:
        code = TEAM_CODE_TO_COUNTRY_CODE[team_code.upper()]
    
    # Try multiple sources in order
    urls = [
        f"https://flagpedia.net/data/flags/w580/{code}.png",
        f"https://flagcdn.com/w320/{code}.png",
        f"https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/{code.replace('gb-', '')}.svg",
    ]
    
    for url in urls:
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    content = await response.read()
                    output_path.write_bytes(content)
                    print(f"  ✓ Downloaded from {url.split('/')[2]}")
                    return True
        except Exception:
            continue
    
    print(f"  ⚠️  Failed to download from all sources")
    return False


async def download_all_logos():
    """Download all team logos and update database."""
    # Create logos directory
    LOGOS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Saving logos to: {LOGOS_DIR}")
    print()
    
    async with async_session_maker() as db_session:
        # Get all teams
        result = await db_session.execute(select(Team))
        teams = result.scalars().all()
        
        print(f"Found {len(teams)} teams")
        print()
        
        # Download logos
        async with aiohttp.ClientSession() as http_session:
            updated_count = 0
            failed_count = 0
            
            for team in teams:
                if not team.code:
                    print(f"⚠️  Skipping {team.name} - no code")
                    failed_count += 1
                    continue
                
                filename = f"{team.code.lower()}.png"
                output_path = LOGOS_DIR / filename
                
                print(f"Downloading {team.name} ({team.code})...")
                
                success = await download_logo(http_session, team.code, output_path)
                
                if success:
                    # Update database with local path
                    team.logo_url = f"/logos/{filename}"
                    print(f"  ✓ Saved to {filename}")
                    updated_count += 1
                else:
                    failed_count += 1
            
            # Commit changes
            await db_session.commit()
            
            print()
            print(f"✓ Downloaded {updated_count} logos")
            if failed_count > 0:
                print(f"⚠️  Failed: {failed_count}")


async def main():
    """Run the logo download script."""
    print("=" * 60)
    print("Team Logo Download Script")
    print("=" * 60)
    print()
    
    await download_all_logos()


if __name__ == "__main__":
    asyncio.run(main())
