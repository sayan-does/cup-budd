"""
Quick verification script to check that all teams have logo URLs.
"""
import asyncio
from sqlalchemy import select
from app.db.session import async_session_maker
from app.db.models.teams import Team


async def verify_logos():
    """Check all teams have logo URLs."""
    async with async_session_maker() as session:
        result = await session.execute(select(Team))
        teams = result.scalars().all()
        
        print(f"Total teams: {len(teams)}")
        print()
        
        with_logos = [t for t in teams if t.logo_url]
        without_logos = [t for t in teams if not t.logo_url]
        
        print(f"✓ Teams with logos: {len(with_logos)}")
        print(f"✗ Teams without logos: {len(without_logos)}")
        print()
        
        if without_logos:
            print("Teams missing logos:")
            for team in without_logos:
                print(f"  - {team.name} ({team.code})")
        else:
            print("🎉 All teams have logo URLs!")
            print()
            print("Sample URLs:")
            for team in teams[:5]:
                print(f"  {team.name:20} → {team.logo_url}")


if __name__ == "__main__":
    asyncio.run(verify_logos())
