from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import get_current_user
import json
from typing import Dict, List
import asyncio

router = APIRouter()

# Connection manager for WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Remove dead connections
                    self.active_connections[user_id].remove(connection)

    async def broadcast_to_user(self, message: str, user_id: int):
        await self.send_personal_message(message, user_id)

    async def broadcast_price_alert(self, car_id: int, new_price: float, user_ids: List[int]):
        message = {
            "type": "price_alert",
            "car_id": car_id,
            "new_price": new_price,
            "message": f"Price drop alert! New price: Rs. {new_price:,.0f}"
        }
        for user_id in user_ids:
            await self.send_personal_message(json.dumps(message), user_id)

    async def broadcast_new_listing(self, listing_data: dict, interested_users: List[int]):
        message = {
            "type": "new_listing",
            "listing": listing_data,
            "message": f"New {listing_data['make']} {listing_data['model']} listing available!"
        }
        for user_id in interested_users:
            await self.send_personal_message(json.dumps(message), user_id)

manager = ConnectionManager()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        # Verify token and get user
        user_id = get_current_user(token)
        if not user_id:
            await websocket.close(code=1008)  # Policy violation
            return

        await manager.connect(websocket, user_id)

        try:
            while True:
                # Keep connection alive and listen for client messages
                data = await websocket.receive_text()
                # Handle any client messages here if needed
                # For now, we just keep the connection open

        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id)

    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass

# Function to send notifications via WebSocket (to be called from other parts of the app)
async def send_websocket_notification(user_id: int, notification_type: str, data: dict):
    message = {
        "type": notification_type,
        **data
    }
    await manager.send_personal_message(json.dumps(message), user_id)

# Function to broadcast price alerts
async def broadcast_price_drop(car_id: int, new_price: float, interested_user_ids: List[int]):
    await manager.broadcast_price_alert(car_id, new_price, interested_user_ids)

# Function to broadcast new listings
async def broadcast_new_listing_alert(listing_data: dict, interested_user_ids: List[int]):
    await manager.broadcast_new_listing(listing_data, interested_user_ids)