"""
Download flag images locally using requests library (no async, simpler).
Tries multiple sources and saves to frontend public directory.
"""
import requests
from pathlib import Path
from app.db.models.teams import Team
from app.db.session import async_session_maker
from sqlalchemy import select
import asyncio

# Where to save logos
LOGOS_DIR = Path(__file__).parent.parent.parent / "frontend" / "public" / "flags"

# Mapping for special cases
TEAM_CODE_TO_FLAG_CODE = {
    "ENG": "gb-eng",
    "SCO": "gb-sct",
    "WAL": "gb-wls",
    "NIR": "gb-nir",
}

def download_flag(team_code: str, output_path: Path) -> bool:
    """Download a flag image."""
    code = team_code.lower()
    if team_code.upper() in TEAM_CODE_TO_FLAG_CODE:
        code = TEAM_CODE_TO_FLAG_CODE[team_code.upper()]
    
    # Try different sources
    sources = [
        f"https://hatscripts.github.io/circle-flags/flags/{code}.svg",
        f"https://purecatamphetamine.github.io/country-flag-icons/3x2/{team_code.upper()}.svg",
    ]
    
    for url in sources:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                output_path.write_bytes(response.content)
                print(f"  ✓ Downloaded from {url.split('/')[2]}")
                return True
        except Exception as e:
            continue
    
    print(f"  ✗ Failed all sources")
    return False


async def main():
    print("=" * 60)
    print("Download Flags Locally")
    print("=" * 60)
    print()
    
    # Create directory
    LOGOS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Saving flags to: {LOGOS_DIR}")
    print()
    
    # Get teams
    async with async_session_maker() as session:
        result = await session.execute(select(Team))
        teams = result.scalars().all()
        
        print(f"Found {len(teams)} teams")
        print()
        
        success = 0
        failed = 0
        
        for team in teams:
            if not team.code:
                print(f"⚠️  Skipping {team.name} - no code")
                failed += 1
                continue
            
            filename = f"{team.code.lower()}.svg"
            output_path = LOGOS_DIR / filename
            
            print(f"Downloading {team.name} ({team.code})...")
            
            if download_flag(team.code, output_path):
                # Update database
                team.logo_url = f"/flags/{filename}"
                team.emoji = None  # Clear emoji since we have image now
                success += 1
            else:
                failed += 1
        
        await session.commit()
        
        print()
        print(f"✓ Downloaded: {success}")
        print(f"✗ Failed: {failed}")


if __name__ == "__main__":
    asyncio.run(main())
