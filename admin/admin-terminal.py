#!/usr/bin/env python3
"""
Admin Terminal - DudeAdrian God Mode Interface
Rich CLI for unified laboratory control
"""

import os
import sys
import json
import asyncio
import aiohttp
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Rich imports
try:
    from rich.console import Console
    from rich.layout import Layout
    from rich.panel import Panel
    from rich.text import Text
    from rich.table import Table
    from rich.live import Live
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.prompt import Prompt
    from rich.align import Align
    from rich import box
except ImportError:
    print("Installing rich...")
    os.system("pip install rich -q")
    from rich.console import Console
    from rich.layout import Layout
    from rich.panel import Panel
    from rich.text import Text
    from rich.table import Table
    from rich.live import Live
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.prompt import Prompt
    from rich.align import Align
    from rich import box

# Configuration
HIVE_URL = "http://localhost:3000"
JARVIS_URL = "http://localhost:8000"
CONFIG_DIR = Path(__file__).parent.parent / "config"
MANIFEST_PATH = CONFIG_DIR / "repos-manifest.json"

console = Console()


class LaboratoryState:
    """Shared state for the laboratory"""
    
    def __init__(self):
        self.hive_status = {"status": "unknown", "agents": 0}
        self.jarvis_status = {"status": "unknown", "commands": 0}
        self.repos_status = {}
        self.last_command = ""
        self.voice_active = False
        self.autonomous_mode = False
        self.log_entries = []
        
    def add_log(self, message: str, level: str = "info"):
        """Add log entry"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_entries.append({
            "time": timestamp,
            "message": message,
            "level": level
        })
        # Keep last 50 entries
        self.log_entries = self.log_entries[-50:]


state = LaboratoryState()


class HivePanel:
    """Hive status panel"""
    
    @staticmethod
    def render() -> Panel:
        """Render Hive panel"""
        table = Table(show_header=False, box=box.SIMPLE)
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")
        
        # Get status
        status = state.hive_status.get("status", "unknown")
        agents = state.hive_status.get("agents", 0)
        genesis = state.hive_status.get("genesis_agents", 0)
        consensus = state.hive_status.get("consensus_rate", 0)
        nectar = state.hive_status.get("nectar_total", 0)
        
        table.add_row("Status", "🟢 Online" if status == "awake" else "🔴 Offline")
        table.add_row("Genesis Hive", f"{genesis:,} / 144,000")
        table.add_row("Consensus", f"{consensus:.1f}%")
        table.add_row("Nectar Flow", f"{nectar:,.2f}")
        table.add_row("Chambers", f"{agents} active")
        
        # Migration progress
        if genesis > 0:
            progress = (genesis / 143000) * 100
            bar = "█" * int(progress / 5) + "░" * (20 - int(progress / 5))
            table.add_row("Migration", f"{bar} {progress:.1f}%")
        
        return Panel(
            table,
            title="[bold cyan]🏛️ Hive Consciousness (10-Hive)[/bold cyan]",
            border_style="cyan"
        )


class ReposPanel:
    """Repositories panel"""
    
    @staticmethod
    def render() -> Panel:
        """Render repos panel"""
        table = Table(show_header=True, box=box.SIMPLE)
        table.add_column("Repo", style="cyan", width=25)
        table.add_column("Status", style="green", width=10)
        table.add_column("Last Commit", style="yellow", width=20)
        
        # Show top 5 repos
        repos = list(state.repos_status.items())[:5]
        for repo_name, repo_data in repos:
            status = repo_data.get("status", "unknown")
            last_commit = repo_data.get("last_commit", "N/A")
            
            status_icon = "🟢" if status == "active" else "⚪"
            table.add_row(repo_name, f"{status_icon} {status}", last_commit[:20])
        
        if len(state.repos_status) > 5:
            table.add_row(f"... {len(state.repos_status) - 5} more", "", "")
        
        return Panel(
            table,
            title="[bold green]📦 Repositories (DudeAdrian/*)[/bold green]",
            border_style="green"
        )


class JarvisPanel:
    """Jarvis panel"""
    
    @staticmethod
    def render() -> Panel:
        """Render Jarvis panel"""
        table = Table(show_header=False, box=box.SIMPLE)
        table.add_column("Metric", style="magenta")
        table.add_column("Value", style="bright_magenta")
        
        status = state.jarvis_status.get("status", "unknown")
        commands = state.jarvis_status.get("commands_executed", 0)
        admin_enrolled = state.jarvis_status.get("admin_enrolled", False)
        
        table.add_row("Status", "🟢 Active" if status == "active" else "🔴 Inactive")
        table.add_row("Admin Voice", "✓ Enrolled" if admin_enrolled else "✗ Not Enrolled")
        table.add_row("Commands", f"{commands}")
        table.add_row("Voice", "🎤 Listening..." if state.voice_active else "🔇 Idle")
        
        return Panel(
            table,
            title="[bold magenta]🧠 Jarvis AI (God Mode)[/bold magenta]",
            border_style="magenta"
        )


class LogPanel:
    """Log panel"""
    
    @staticmethod
    def render() -> Panel:
        """Render log panel"""
        log_text = ""
        for entry in state.log_entries[-15:]:
            time_str = entry["time"]
            message = entry["message"]
            level = entry["level"]
            
            color = {
                "info": "white",
                "success": "green",
                "warning": "yellow",
                "error": "red"
            }.get(level, "white")
            
            log_text += f"[{time_str}] [{color}]{message}[/{color}]\n"
        
        return Panel(
            Text.from_markup(log_text) if log_text else Text("No activity yet..."),
            title="[bold yellow]📜 Activity Log[/bold yellow]",
            border_style="yellow",
            height=15
        )


class CommandPanel:
    """Command panel"""
    
    @staticmethod
    def render() -> Panel:
        """Render command panel"""
        text = Text()
        text.append("🎤 ", style="bold cyan")
        text.append("Voice: ", style="cyan")
        text.append("Say 'Sofie' followed by command\n", style="dim")
        
        text.append("💬 ", style="bold green")
        text.append("Examples:\n", style="green")
        text.append("  • 'Sofie, status of all repos'\n", style="dim")
        text.append("  • 'Sofie, build water API in terracare-water'\n", style="dim")
        text.append("  • 'Sofie, check Hive'\n", style="dim")
        text.append("  • 'Sofie, what is my treasury?'\n", style="dim")
        
        text.append("\n⌨️  ", style="bold yellow")
        text.append("Type command or press ", style="yellow")
        text.append("[Enter] ", style="bold")
        text.append("for voice mode", style="yellow")
        
        return Panel(
            text,
            title="[bold blue]💻 Commands[/bold blue]",
            border_style="blue"
        )


def create_layout() -> Layout:
    """Create the terminal layout"""
    layout = Layout()
    
    # Header
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="main"),
        Layout(name="footer", size=3)
    )
    
    # Main area
    layout["main"].split_row(
        Layout(name="left", ratio=1),
        Layout(name="right", ratio=1)
    )
    
    # Left column
    layout["left"].split_column(
        Layout(name="hive"),
        Layout(name="repos")
    )
    
    # Right column
    layout["right"].split_column(
        Layout(name="jarvis"),
        Layout(name="command"),
        Layout(name="log")
    )
    
    return layout


def render_header() -> Panel:
    """Render header"""
    text = Text()
    text.append("👤 DudeAdrian", style="bold cyan")
    text.append(" | ", style="dim")
    text.append("🌐 github.com/DudeAdrian", style="cyan")
    text.append(" | ", style="dim")
    text.append("📦 20 Repos", style="green")
    text.append(" | ", style="dim")
    text.append("🔗 Ledger Anchored", style="yellow")
    text.append(" | ", style="dim")
    text.append("🔴 God Mode", style="bold red")
    
    return Panel(
        Align.center(text),
        style="bold white on dark_blue"
    )


def render_footer() -> Panel:
    """Render footer"""
    text = Text()
    text.append("🚀 ", style="bold")
    text.append("Hive: ", style="cyan")
    text.append(f"{HIVE_URL} ", style="dim")
    text.append("| ", style="dim")
    text.append("🧠 ", style="bold")
    text.append("Jarvis: ", style="magenta")
    text.append(f"{JARVIS_URL} ", style="dim")
    text.append("| ", style="dim")
    text.append("Press Ctrl+C to exit", style="yellow")
    
    return Panel(
        Align.center(text),
        style="dim"
    )


async def update_status():
    """Background task to update status"""
    async with aiohttp.ClientSession() as session:
        while True:
            try:
                # Update Hive status
                async with session.get(f"{HIVE_URL}/api/hives/status") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        state.hive_status = {
                            "status": "awake",
                            "agents": sum(h.get("current", 0) for h in data.get("hives", [])),
                            "genesis_agents": data.get("hives", [{}])[0].get("current", 0),
                            "consensus_rate": 66.0,  # Placeholder
                            "nectar_total": 15000.0  # Placeholder
                        }
            except:
                state.hive_status = {"status": "offline"}
            
            try:
                # Update Jarvis status
                async with session.get(f"{JARVIS_URL}/jarvis/status") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        state.jarvis_status = data
            except:
                state.jarvis_status = {"status": "offline"}
            
            try:
                # Update repos status
                async with session.get(f"{JARVIS_URL}/jarvis/repos") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        repos = data.get("repositories", [])
                        for repo in repos:
                            state.repos_status[repo.get("name", "unknown")] = repo
            except:
                pass
            
            await asyncio.sleep(5)


async def handle_command(command: str):
    """Handle a command"""
    state.add_log(f"Processing: {command}", "info")
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{JARVIS_URL}/jarvis/execute",
                json={"command": command, "confirmed": True}
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get("result", {}).get("success"):
                        state.add_log(f"✓ {data['result']['message']}", "success")
                    else:
                        state.add_log(f"✗ {data['result']['message']}", "error")
                else:
                    state.add_log(f"Error: HTTP {resp.status}", "error")
        except Exception as e:
            state.add_log(f"Error: {str(e)}", "error")


def input_thread():
    """Handle user input in separate thread"""
    while True:
        try:
            command = input()
            if command.strip():
                # Schedule command
                asyncio.create_task(handle_command(command))
        except EOFError:
            break


async def main():
    """Main terminal interface"""
    # Check if services are running
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{HIVE_URL}/health") as resp:
                if resp.status != 200:
                    console.print("[red]❌ Hive not running. Start with: ./sofie.sh[/red]")
                    return
    except:
        console.print("[red]❌ Hive not running. Start with: ./sofie.sh[/red]")
        return
    
    # Create layout
    layout = create_layout()
    
    # Start background updates
    update_task = asyncio.create_task(update_status())
    
    # Initial log
    state.add_log("God Mode Terminal initialized", "success")
    state.add_log("Connected to Hive and Jarvis", "success")
    
    with Live(layout, refresh_per_second=4, screen=True) as live:
        while True:
            # Update panels
            layout["header"].update(render_header())
            layout["hive"].update(HivePanel.render())
            layout["repos"].update(ReposPanel.render())
            layout["jarvis"].update(JarvisPanel.render())
            layout["command"].update(CommandPanel.render())
            layout["log"].update(LogPanel.render())
            layout["footer"].update(render_footer())
            
            # Check for input (non-blocking)
            await asyncio.sleep(0.1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[yellow]👋 Goodbye![/yellow]")
