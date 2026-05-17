export function roleMiddleware(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const userRole = req.user.perfil || req.user.role;
    
    if (!rolesPermitidos.includes(userRole)) {
      return res.status(403).json({ 
        message: `No tienes permiso. Se requiere: ${rolesPermitidos.join(', ')}` 
      });
    }
    
    next();
  };
}
