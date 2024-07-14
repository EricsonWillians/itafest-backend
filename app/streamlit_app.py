import streamlit as st
import nest_asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from datetime import datetime
from decimal import Decimal
import asyncio
from pydantic import BaseModel, PydanticObjectId
from typing import Optional, List

# Import models and services
from app.models.event import Event, EventCreate
from app.models.promotion import Promotion, PromotionCreate
from app.models.user_profile import UserProfile, UserProfileCreate
from app.models.message import Message, MessageCreate
from app.models.ticket import Ticket, TicketCreate
from app.models.review import Review, ReviewCreate

from app.services.event import create_event, get_event, list_events
from app.services.promotion import create_promotion, get_promotion, list_promotions
from app.services.user_profile import create_user_profile, get_user_profile, list_user_profiles
from app.services.message import create_message, get_message, list_messages
from app.services.ticket import create_ticket, get_ticket, list_tickets
from app.services.review import create_review, get_review, list_reviews

# Apply nest_asyncio to allow nested event loops
nest_asyncio.apply()

# Database configuration
MONGODB_URL = "mongodb://localhost:27017/itafest"
client = AsyncIOMotorClient(MONGODB_URL)
database = client.get_database()

# Initialize beanie with models
async def init():
    await init_beanie(database, document_models=[Event, Promotion, UserProfile, Message, Ticket, Review])

# Run initialization
asyncio.run(init())

# Streamlit UI
st.set_page_config(page_title="Itafest Admin Panel", layout="wide")

# Custom CSS for color scheme
st.markdown("""
    <style>
    .stApp {
        background-color: #303030;
        color: #f0f0f0;
        font-family: Arial, sans-serif;
    }
    .stTabs [data-baseweb="tab"] {
        background-color: #A1E6EF;
        color: #303030;
        font-weight: bold;
        border-radius: 5px 5px 0 0;
        padding: 0.5rem 1rem;
    }
    .stTabs [data-baseweb="tab"]:hover {
        background-color: #74E9D4;
    }
    .stTabs [data-baseweb="tab"][aria-selected="true"] {
        background-color: #039BBA;
        color: #ffffff;
    }
    .stButton>button {
        background-color: #039BBA;
        color: white;
        border-radius: 5px;
        padding: 0.5rem 1rem;
        border: none;
    }
    .stTextInput>div>div>input, .stTextArea>div>textarea, .stNumberInput>div>div>input {
        background-color: #99B0EA;
        color: black;
        border-radius: 5px;
        border: 1px solid #444;
        padding: 0.5rem;
    }
    .stDateInput>div>div>div>input, .stTimeInput>div>div>div>input {
        background-color: #3AD5C8;
        color: black;
        border-radius: 5px;
        border: 1px solid #444;
        padding: 0.5rem;
    }
    .stForm>div>div>button {
        background-color: #9799EF;
        color: white;
        border-radius: 5px;
        padding: 0.5rem 1rem;
        border: none;
    }
    .stContainer>div {
        background-color: #A1E6EF;
        padding: 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    h1, h2, h3, h4 {
        color: #FFFFFF;
    }
    .stForm {
        padding: 1rem;
        background-color: #A1E6EF;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    </style>
    """, unsafe_allow_html=True)

st.title("Itafest Admin Panel")

# Tabs
tabs = st.tabs([
    "Create Event", "Create Promotion", "Create User Profile", "Create Message", "Create Ticket", 
    "Create Review", "List Events", "List Promotions", "List User Profiles", "List Messages", "List Tickets", "List Reviews"
])

with tabs[0]:
    st.header("Create Event")
    with st.form("event_form"):
        st.markdown("#### Enter event details below:")
        title = st.text_input("Title")
        description = st.text_area("Description")
        date = st.date_input("Date")
        time = st.time_input("Time")
        location = st.text_input("Location")
        submit_event = st.form_submit_button("Create Event")

        if submit_event:
            event_date = datetime.combine(date, time)
            event = EventCreate(title=title, description=description, date=event_date, location=location)
            asyncio.run(create_event(event))
            st.success("Event created successfully")

with tabs[1]:
    st.header("Create Promotion")
    with st.form("promotion_form"):
        st.markdown("#### Enter promotion details below:")
        title = st.text_input("Title")
        description = st.text_area("Description")
        discount = st.number_input("Discount", min_value=0.0, max_value=100.0, step=0.1, format="%.2f")
        start_date = st.date_input("Start Date")
        end_date = st.date_input("End Date")
        submit_promotion = st.form_submit_button("Create Promotion")

        if submit_promotion:
            promotion = PromotionCreate(title=title, description=description, discount=Decimal(discount), start_date=start_date, end_date=end_date)
            asyncio.run(create_promotion(promotion))
            st.success("Promotion created successfully")

with tabs[2]:
    st.header("Create User Profile")
    with st.form("profile_form"):
        st.markdown("#### Enter user profile details below:")
        user_id = st.text_input("User ID")
        bio = st.text_area("Bio")
        profile_picture = st.text_input("Profile Picture URL")
        social_media_links = st.text_area("Social Media Links (JSON format)")
        show_comments = st.checkbox("Show Comments", value=True)
        allow_chat = st.checkbox("Allow Chat", value=True)
        blocked_users = st.text_area("Blocked Users (comma-separated IDs)")
        submit_profile = st.form_submit_button("Create Profile")

        if submit_profile:
            profile = UserProfileCreate(
                user_id=user_id,
                bio=bio,
                profile_picture=profile_picture,
                social_media_links=social_media_links,
                show_comments=show_comments,
                allow_chat=allow_chat,
                blocked_users=blocked_users.split(','),
            )
            asyncio.run(create_user_profile(profile))
            st.success("User profile created successfully")

with tabs[3]:
    st.header("Create Message")
    with st.form("message_form"):
        st.markdown("#### Enter message details below:")
        sender_id = st.text_input("Sender ID")
        receiver_id = st.text_input("Receiver ID")
        message_type = st.text_input("Message Type")
        content = st.text_area("Content")
        submit_message = st.form_submit_button("Create Message")

        if submit_message:
            message = MessageCreate(
                sender_id=PydanticObjectId(sender_id),
                receiver_id=PydanticObjectId(receiver_id),
                message_type=message_type,
                content=content
            )
            asyncio.run(create_message(message))
            st.success("Message created successfully")

with tabs[4]:
    st.header("Create Ticket")
    with st.form("ticket_form"):
        st.markdown("#### Enter ticket details below:")
        event_id = st.text_input("Event ID")
        ticket_type = st.text_input("Ticket Type")
        price = st.number_input("Price", min_value=0.0, step=0.01, format="%.2f")
        quantity = st.number_input("Quantity", min_value=1, step=1)
        sale_start_date = st.date_input("Sale Start Date")
        sale_end_date = st.date_input("Sale End Date")
        submit_ticket = st.form_submit_button("Create Ticket")

        if submit_ticket:
            ticket = TicketCreate(
                event_id=event_id,
                type=ticket_type,
                price=Decimal(price),
                quantity=quantity,
                sale_start_date=sale_start_date,
                sale_end_date=sale_end_date
            )
            asyncio.run(create_ticket(ticket))
            st.success("Ticket created successfully")

with tabs[5]:
    st.header("Create Review")
    with st.form("review_form"):
        st.markdown("#### Enter review details below:")
        user_id = st.text_input("User ID")
        target_id = st.text_input("Target ID")
        target_type = st.text_input("Target Type (business/event)")
        rating = st.text_area("Rating (JSON format)")
        comment = st.text_area("Comment")
        submit_review = st.form_submit_button("Create Review")

        if submit_review:
            review = ReviewCreate(
                user_id=user_id,
                target_id=target_id,
                target_type=target_type,
                rating=rating,
                comment=comment
            )
            asyncio.run(create_review(review))
            st.success("Review created successfully")

with tabs[6]:
    st.header("List Events")
    events = asyncio.run(list_events())
    for event in events:
        st.write(event.dict())

with tabs[7]:
    st.header("List Promotions")
    promotions = asyncio.run(list_promotions())
    for promotion in promotions:
        st.write(promotion.dict())

with tabs[8]:
    st.header("List User Profiles")
    profiles = asyncio.run(list_user_profiles())
    for profile in profiles:
        st.write(profile.dict())

with tabs[9]:
    st.header("List Messages")
    messages = asyncio.run(list_messages())
    for message in messages:
        st.write(message.dict())

with tabs[10]:
    st.header("List Tickets")
    tickets = asyncio.run(list_tickets())
    for ticket in tickets:
        st.write(ticket.dict())

with tabs[11]:
    st.header("List Reviews")
    reviews = asyncio.run(list_reviews())
    for review in reviews:
        st.write(review.dict())
