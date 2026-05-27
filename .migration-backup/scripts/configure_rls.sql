DROP POLICY IF EXISTS "Lecture matieres publique" ON matieres;
CREATE POLICY "Lecture matieres publique"
    ON matieres FOR SELECT
    USING (true);
