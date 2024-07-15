import streamlit as st
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from pydantic import BaseModel
import json
import asyncio
import nest_asyncio

# Import models and services
from app.models.event import Event, EventCreate
from app.models.promotion import Promotion, PromotionCreate
from app.models.user_profile import UserProfile, UserProfileCreate
from app.models.message import Message, MessageCreate
from app.models.ticket import Ticket, TicketCreate
from app.models.review import Review, ReviewCreate

from app.services.event import create_event, get_event, list_events
from app.services.promotion import create_promotion, get_promotion, list_promotions
from app.services.user_profile import create_user_profile, get_user_profile, get_user_profiles
from app.services.message import create_message, get_message, get_all_messages
from app.services.ticket import create_ticket, get_ticket, get_all_tickets
from app.services.review import create_review, get_review, get_all_reviews

# Database configuration
MONGODB_URL = "mongodb://localhost:27017/itafest"

# Initialize beanie with models
async def init():
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client.get_database()
    await init_beanie(database, document_models=[Event, Promotion, UserProfile, Message, Ticket, Review])

# Ensure that the event loop is created and run the init function
if 'initialized' not in st.session_state:
    nest_asyncio.apply()
    loop = asyncio.get_event_loop()
    loop.run_until_complete(init())
    st.session_state['initialized'] = True

# Helper function to run synchronous functions
def run_async(func, *args, **kwargs):
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(func(*args, **kwargs))

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

def create_form(label, schema):
    with st.form(label):
        st.markdown(f"#### Enter {label.lower()} details below:")
        json_input = st.text_area("JSON Input", height=200)
        submit_json = st.form_submit_button("Submit JSON")

        if submit_json:
            try:
                data = json.loads(json_input)
                obj = schema(**data)
                return obj
            except json.JSONDecodeError:
                st.error("Invalid JSON format")
            except Exception as e:
                st.error(f"Error: {e}")

        return None

with tabs[0]:
    st.header("Create Event")
    event = create_form("Event", EventCreate)
    if event:
        run_async(create_event, event)
        st.success("Event created successfully")

with tabs[1]:
    st.header("Create Promotion")
    promotion = create_form("Promotion", PromotionCreate)
    if promotion:
        run_async(create_promotion, promotion)
        st.success("Promotion created successfully")

with tabs[2]:
    st.header("Create User Profile")
    profile = create_form("User Profile", UserProfileCreate)
    if profile:
        run_async(create_user_profile, profile)
        st.success("User profile created successfully")

with tabs[3]:
    st.header("Create Message")
    message = create_form("Message", MessageCreate)
    if message:
        run_async(create_message, message)
        st.success("Message created successfully")

with tabs[4]:
    st.header("Create Ticket")
    ticket = create_form("Ticket", TicketCreate)
    if ticket:
        run_async(create_ticket, ticket)
        st.success("Ticket created successfully")

with tabs[5]:
    st.header("Create Review")
    review = create_form("Review", ReviewCreate)
    if review:
        run_async(create_review, review)
        st.success("Review created successfully")

def list_items(list_func, label):
    items = run_async(list_func)
    for item in items:
        st.write(item.dict())

with tabs[6]:
    st.header("List Events")
    list_items(list_events, "Events")

with tabs[7]:
    st.header("List Promotions")
    list_items(list_promotions, "Promotions")

with tabs[8]:
    st.header("List User Profiles")
    list_items(get_user_profiles, "User Profiles")

with tabs[9]:
    st.header("List Messages")
    list_items(get_all_messages, "Messages")

with tabs[10]:
    st.header("List Tickets")
    list_items(get_all_tickets, "Tickets")

with tabs[11]:
    st.header("List Reviews")
    list_items(get_all_reviews, "Reviews")
