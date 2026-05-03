from pydantic import BaseModel
class CarInput(BaseModel):
    year:int
    engine_cc:int
    mileage_km:float                            
    num_owners:int
    registered:str
    condition:str
    make:str
    model:str
    fuel_type:str
    transmission:str
    color:str
    city:str
    registration_city:str

