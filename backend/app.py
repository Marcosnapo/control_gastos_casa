from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuración de la base de datos SQLite
# Ruta absoluta al archivo de la base de datos
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, 'gastos.db') # El archivo de la BD se llamará gastos.db
    
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DATABASE_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Para deshabilitar advertencias de eventos
    
db = SQLAlchemy(app)

# Definición del Modelo de Datos (POO) para Gasto
class Gasto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(200), nullable=False)
    monto = db.Column(db.Float, nullable=False)
    fecha = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    categoria = db.Column(db.String(50), nullable=False)
    pagado = db.Column(db.Boolean, default=False) # Para marcar si está pagado/conciliado

    def __repr__(self):
        return f'<Gasto {self.id}: {self.descripcion} - {self.monto}>'

    # Método para convertir el objeto Gasto en un diccionario (útil para jsonify)
    def to_dict(self):
        return {
            'id': self.id,
            'descripcion': self.descripcion,
            'monto': self.monto,
            'fecha': self.fecha.isoformat(), # Convertir fecha a string ISO 8601
            'categoria': self.categoria,
            'pagado': self.pagado
        }

@app.route('/')
def home():
    return "¡Bienvenido al Backend de Control de Gastos!"

# --- Rutas CRUD para Gastos ---

# GET: Obtener todos los gastos
@app.route('/api/gastos', methods=['GET'])
def get_gastos():
    gastos = Gasto.query.all() # Obtiene todos los objetos Gasto de la BD
    return jsonify([gasto.to_dict() for gasto in gastos]) # Convierte cada objeto a dict y luego a JSON

# POST: Añadir un nuevo gasto
@app.route('/api/gastos', methods=['POST'])
def add_gasto():
    data = request.get_json() # Obtener los datos JSON de la solicitud

    descripcion = data.get('descripcion')
    monto = data.get('monto')
    fecha_str = data.get('fecha') # Fecha viene como string del frontend
    categoria = data.get('categoria')

    # Validaciones básicas de datos
    if not descripcion or not monto or not categoria:
        return jsonify({"error": "Faltan campos obligatorios: descripcion, monto, categoria."}), 400
    
    try:
        monto = float(monto) # Asegurarse de que el monto es un número
    except ValueError:
        return jsonify({"error": "El monto debe ser un número válido."}), 400

    try:
        # Convertir string de fecha a objeto datetime
        # Asumimos formato 'YYYY-MM-DD' del frontend
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d') if fecha_str else datetime.utcnow()
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido. Usa YYYY-MM-DD."}), 400


    nuevo_gasto = Gasto(
        descripcion=descripcion,
        monto=monto,
        fecha=fecha,
        categoria=categoria,
        pagado=data.get('pagado', False) # Si no se envía 'pagado', por defecto es False
    )
    
    db.session.add(nuevo_gasto) # Añadir el nuevo gasto a la sesión de la BD
    db.session.commit() # Guardar los cambios en la BD

    return jsonify(nuevo_gasto.to_dict()), 201 # 201 Created

# PUT: Actualizar un gasto (ej. marcar como pagado/conciliado)
@app.route('/api/gastos/<int:gasto_id>', methods=['PUT'])
def update_gasto(gasto_id):
    gasto = Gasto.query.get(gasto_id) # Buscar el gasto por su ID
    
    if not gasto:
        return jsonify({"error": "Gasto no encontrado."}), 404

    data = request.get_json()

    # Actualizar campos solo si se proporcionan en la solicitud
    if 'descripcion' in data:
        gasto.descripcion = data['descripcion']
    if 'monto' in data:
        try:
            gasto.monto = float(data['monto'])
        except ValueError:
            return jsonify({"error": "El monto debe ser un número válido."}), 400
    if 'fecha' in data:
        try:
            gasto.fecha = datetime.strptime(data['fecha'], '%Y-%m-%d')
        except ValueError:
            return jsonify({"error": "Formato de fecha inválido. Usa YYYY-MM-DD."}), 400
    if 'categoria' in data:
        gasto.categoria = data['categoria']
    if 'pagado' in data:
        gasto.pagado = data['pagado'] # Esto actualizará el campo 'pagado'

    db.session.commit() # Guardar los cambios en la BD
    return jsonify(gasto.to_dict()) # Devolver el gasto actualizado

# DELETE: Borrar un gasto
@app.route('/api/gastos/<int:gasto_id>', methods=['DELETE'])
def delete_gasto(gasto_id):
    gasto = Gasto.query.get(gasto_id) # Buscar el gasto por su ID

    if not gasto:
        return jsonify({"error": "Gasto no encontrado."}), 404
    
    db.session.delete(gasto) # Eliminar el gasto de la sesión
    db.session.commit() # Guardar los cambios en la BD

    return jsonify({"message": "Gasto eliminado con éxito."}), 200 # 200 OK

# --- Fin Rutas CRUD ---

if __name__ == '__main__':
    # Asegúrate de que la base de datos se cree si no existe
    with app.app_context():
        db.create_all() # Esto crea las tablas si no existen
        print(f"Base de datos SQLite creada/conectada en: {DATABASE_PATH}")
    
    app.run(debug=True)